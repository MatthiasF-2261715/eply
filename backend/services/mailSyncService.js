const cron = require('node-cron');
const { getImapCredentials, getAssistantByEmail } = require('../database');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { validateEmail } = require('./emailValidationService');
const { useAssistant } = require('../assistant');
const { createImapDraft } = require('./draftService');
const { getImapSentEmails } = require('./imapService');

let latestMessages = [];
let lastError = null;
let lastCheckTimestamps = {}; // Store last check time per account

async function processNewEmail(message, account) {
    try {
        console.log(`Processing new email: ${message.subject} from ${message.from}`);
        
        // Validate email (skip automated/spam)
        console.log(`Email content: ${message.text}`);
        const emailContent = message.text || '';
        const isValid = await validateEmail(message.from, emailContent);
        
        if (!isValid) {
            console.log(`Skipping automated/spam email from ${message.from}`);
            return;
        }

        // Get user's assistant
        const assistantObj = await getAssistantByEmail(account.email);
        const assistantId = assistantObj.assistant_id || assistantObj.id;

        // Get sent emails for context
        const sentEmails = await getImapSentEmails({
            email: account.email,
            password: account.password,
            imapServer: account.server,
            port: account.port
        });

        // Generate AI response
        const currentEmail = { 
            from: emailContent, 
            title: message.subject 
        };
        const aiResponse = await useAssistant(assistantId, currentEmail, sentEmails);

        console.log(`Generated AI response for email from ${message.from}`);

        // Create draft reply
        const session = {
            imap: {
                email: account.email,
                password: account.password,
                imapServer: account.server,
                port: account.port
            }
        };

        await createImapDraft(
            session, 
            aiResponse, 
            message.uid, 
            emailContent,
            { treatAsUid: true }
        );

        console.log(`Draft reply created for email from ${message.from}`);

    } catch (error) {
        console.error(`Error processing email ${message.subject}:`, error);
    }
}

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
                for await (let msg of client.fetch('1:*', { 
                    uid: true, 
                    envelope: true,
                    source: true
                })) {
                    const messageDate = new Date(msg.envelope.date);
                    
                    // Only include messages received after last check
                    if (messageDate > lastCheckTime) {
                        try {
                            const parsed = await simpleParser(msg.source);
                            const emailData = {
                                uid: msg.uid,
                                subject: msg.envelope.subject,
                                from: msg.envelope.from?.[0]?.address,
                                date: msg.envelope.date,
                                text: parsed.text,
                                accountEmail: account.email
                            };
                            
                            messages.push(emailData);
                            
                            // Process this new email immediately
                            await processNewEmail(emailData, account);
                            
                        } catch (parseError) {
                            console.error('Error parsing message:', parseError);
                        }
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