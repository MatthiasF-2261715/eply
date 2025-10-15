const cron = require('node-cron');
const { getImapCredentials } = require('../database');
const { ImapFlow } = require('imapflow');

let latestMessages = [];
let lastError = null;

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

        const allMessages = [];
        const errors = [];

        for (const account of imapAccounts) {
            try {
                console.log(`Attempting to connect to ${account.server} for ${account.email}...`);
                console.log(account.password);
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

                const messages = [];
                for await (let message of client.fetch('1:*', { 
                    uid: true, 
                    envelope: true, 
                    bodyStructure: true 
                })) {
                    messages.push({
                        uid: message.uid,
                        subject: message.envelope.subject,
                        from: message.envelope.from?.[0]?.address,
                        date: message.envelope.date,
                        accountEmail: account.email
                    });
                }

                allMessages.push(...messages.slice(-10));
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

        // Sort all messages by date descending
        allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Store only the latest 10 messages
        latestMessages = allMessages.slice(0, 10);
        lastError = errors.length > 0 ? errors : null;

        console.log('Email check completed. Latest messages:', latestMessages);

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