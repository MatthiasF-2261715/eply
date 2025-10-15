const cron = require('node-cron');
const { getImapCredentials } = require('../database');
const { ImapFlow } = require('imapflow');

let latestMessages = [];
let lastError = null;
let lastCheckTimestamps = {}; // Store last check time per account

async function checkEmails() {
    try {
        console.log('Starting email check...');
        // Get all IMAP accounts from database
        const imapAccounts = await getImapCredentials();
        console.log(`Found ${imapAccounts.length} IMAP accounts.`);
        
        if (imapAccounts.length === 0) {
            latestMessages = [];
            return;
        }

        const newMessages = [];
        const errors = [];

        for (const account of imapAccounts) {
            try {
                console.log(`Attempting to connect to ${account.server} for ${account.email}...`);
                const client = new ImapFlow({
                    host: account.server,
                    port: account.port,
                    secure: true,
                    auth: {
                        user: account.email,
                        pass: account.password
                    },
                    logger: false,
                    tlsOptions: { 
                        rejectUnauthorized: false 
                    }
                });

                await client.connect();
                console.log(`Successfully connected to ${account.email}`);
                
                await client.mailboxOpen('INBOX');
                console.log(`Opened INBOX for ${account.email}`);

                const currentCheckTime = new Date();
                
                // If this is the first check, set lastCheckTime to now (so we don't fetch old emails)
                if (!lastCheckTimestamps[account.email]) {
                    console.log(`First check for ${account.email}, setting baseline timestamp. No emails will be fetched.`);
                    lastCheckTimestamps[account.email] = currentCheckTime;
                    await client.logout();
                    continue; // Skip to next account
                }

                const lastCheckTime = lastCheckTimestamps[account.email];

                const messages = [];
                for await (let message of client.fetch('1:*', { 
                    uid: true, 
                    envelope: true, 
                    bodyStructure: true 
                })) {
                    const messageDate = new Date(message.envelope.date);
                    
                    // Only include messages received after last check
                    if (messageDate > lastCheckTime) {
                        messages.push({
                            uid: message.uid,
                            subject: message.envelope.subject,
                            from: message.envelope.from?.[0]?.address,
                            date: message.envelope.date,
                            accountEmail: account.email
                        });
                    }
                }

                if (messages.length > 0) {
                    console.log(`Found ${messages.length} new email(s) for ${account.email}:`);
                    messages.forEach(msg => {
                        console.log(`  - From: ${msg.from}, Subject: ${msg.subject}, Date: ${msg.date}`);
                    });
                    newMessages.push(...messages);
                } else {
                    console.log(`No new emails for ${account.email}`);
                }

                // Update last check timestamp for this account
                lastCheckTimestamps[account.email] = currentCheckTime;

                await client.logout();

            } catch (error) {
                const errorMessage = error.authenticationFailed 
                    ? 'Authentication failed - please check email and password'
                    : error.message;
                    
                console.error(`Error fetching emails for ${account.email}:`, {
                    error: errorMessage,
                    server: account.server,
                    port: account.port,
                    secure: true
                });
                
                errors.push({
                    email: account.email,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Sort new messages by date descending
        newMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Store the new messages
        latestMessages = newMessages;
        lastError = errors.length > 0 ? errors : null;

        console.log(`Email check completed. Found ${newMessages.length} new message(s) in total.`);

    } catch (error) {
        console.error('Error in mail sync service:', error);
        lastError = [{ error: 'Failed to fetch emails' }];
    }
}

// Run every 1 minute
cron.schedule('*/1 * * * *', checkEmails);

// Initial check on startup
checkEmails();

module.exports = { 
    getLatestMessages: () => ({ messages: latestMessages, errors: lastError })
};