// imapService.js
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

// Connection pool om bestaande connecties te hergebruiken
const connectionPool = new Map();

function getConnectionKey(imapConfig) {
    return `${imapConfig.email}:${imapConfig.imapServer}:${imapConfig.port}`;
}

async function getImapConnection(imapConfig) {
    const connectionKey = getConnectionKey(imapConfig);

    let client = connectionPool.get(connectionKey);
    if (client && client.usable) {
        return client;
    }

    client = new ImapFlow({
        host: imapConfig.imapServer,
        port: parseInt(imapConfig.port, 10),
        secure: true,
        auth: {
            user: imapConfig.email,
            pass: imapConfig.password
        },
        logger: false
    });

    await client.connect();
    connectionPool.set(connectionKey, client);
    return client;
}

async function getImapInboxEmails(imapConfig) {
    const client = await getImapConnection(imapConfig);
    await client.mailboxOpen('INBOX');

    const total = client.mailbox.exists;
    if (total === 0) {
        return [];
    }

    const start = Math.max(1, total - 9);
    const mails = [];

    for await (let msg of client.fetch(`${start}:${total}`, { source: true })) {
        try {
            const parsed = await simpleParser(msg.source);
            console.log("Parsed email: ", parsed);
            mails.push({
                subject: parsed.subject,
                from: parsed.from?.text,
                to: parsed.to?.text,
                date: parsed.date,
                text: parsed.text,
                html: parsed.html,
                attachments: parsed.attachments
            });
        } catch (err) {
            console.error('[IMAP] Parse error:', err);
        }
    }

    return mails.reverse();
}

async function getImapSentEmails(imapConfig) {
    const client = await getImapConnection(imapConfig);

    const sentFolders = ['Sent', 'SENT', '[Gmail]/Sent Mail'];
    for (let folder of sentFolders) {
        try {
            await client.mailboxOpen(folder);

            const total = client.mailbox.exists;
            if (total === 0) return [];

            const start = Math.max(1, total - 9);
            const mails = [];

            for await (let msg of client.fetch(`${start}:${total}`, { source: true })) {
                try {
                    const parsed = await simpleParser(msg.source);
                    mails.push({
                        subject: parsed.subject,
                        from: parsed.from?.text,
                        to: parsed.to?.text,
                        date: parsed.date,
                        text: parsed.text,
                        html: parsed.html,
                        attachments: parsed.attachments
                    });
                } catch (err) {
                    console.error('[IMAP] Parse error:', err);
                }
            }

            return mails.reverse();
        } catch {
            // probeer volgende folder
        }
    }

    throw new Error('Could not find sent folder');
}

async function closeAllConnections() {
    for (const [key, client] of connectionPool) {
        try {
            await client.logout();
        } catch (e) {}
    }
    connectionPool.clear();
}

process.on('SIGINT', closeAllConnections);
process.on('SIGTERM', closeAllConnections);

module.exports = { getImapInboxEmails, getImapSentEmails, closeAllConnections };
