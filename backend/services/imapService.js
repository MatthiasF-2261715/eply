const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { transformMail } = require('../utils/emailTransform');

const connectionPool = new Map();

function getConnectionKey(imapConfig) {
    return `${imapConfig.email}:${imapConfig.imapServer}:${imapConfig.port}`;
}

function setupImap(imapConfig) {
    return new Imap({
        user: imapConfig.email,
        password: imapConfig.password,
        host: imapConfig.imapServer,
        port: parseInt(imapConfig.port, 10),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 5000,
        keepalive: {
            interval: 10000,
            idleInterval: 300000,
            forceNoop: true
        }
    });
}

async function getImapConnection(imapConfig) {
    const connectionKey = getConnectionKey(imapConfig);
    let connection = connectionPool.get(connectionKey);

    if (connection && connection.state === 'authenticated') {
        console.log(`[IMAP] Reusing connection for ${connectionKey}`);
        return connection;
    }

    if (connection) {
        try {
            connection.end();
        } catch (e) {}
        connectionPool.delete(connectionKey);
    }

    console.log(`[IMAP] Creating new connection for ${connectionKey}`);

    return new Promise((resolve, reject) => {
        const imap = setupImap(imapConfig);
        let timeoutId = setupTimeout(imap, reject);

        imap.once('ready', function () {
            clearTimeout(timeoutId);
            console.log('[IMAP] Connection ready');
            connectionPool.set(connectionKey, imap);
            resolve(imap);
        });

        setupImapListeners(imap, timeoutId, reject, connectionKey);
        imap.connect();
    });
}

async function getImapSentEmails(imapConfig) {
    let imap;
    try {
        imap = await getImapConnection(imapConfig);
        return await tryFindSentFolder(imap);
    } catch (error) {
        console.error('Error getting sent emails:', error);
        throw error;
    }
}

async function getImapInboxEmails(imapConfig) {
    let imap;
    try {
        imap = await getImapConnection(imapConfig);
        return await openInbox(imap);
    } catch (error) {
        console.error('Error getting inbox emails:', error);
        throw error;
    }
}

function setupTimeout(imap, reject) {
    return setTimeout(() => {
        try {
            imap.end();
        } catch (e) {}
        reject(new Error('IMAP connection timeout'));
    }, 30000);
}

function setupImapListeners(imap, timeoutId, reject, connectionKey) {
    imap.once('error', (err) => {
        clearTimeout(timeoutId);
        if (connectionKey) connectionPool.delete(connectionKey);
        console.error('[IMAP] Error event:', err);
        reject(new Error(`IMAP error: ${err.message}`));
    });

    imap.once('end', () => {
        clearTimeout(timeoutId);
        if (connectionKey) connectionPool.delete(connectionKey);
        console.log('[IMAP] Connection ended');
    });

    imap.once('close', () => {
        if (connectionKey) connectionPool.delete(connectionKey);
        console.log('[IMAP] Connection closed');
    });
}

function openInbox(imap) {
    return new Promise((resolve, reject) => {
        console.log('[IMAP] Opening INBOX...');
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('[IMAP] Failed to open inbox:', err);
                reject(new Error('Could not open inbox'));
                return;
            }
            console.log(`[IMAP] INBOX opened, total messages: ${box.messages.total}`);
            fetchEmails(imap, box, resolve, reject);
        });
    });
}

function tryFindSentFolder(imap) {
    return new Promise((resolve, reject) => {
        const sentFolders = ['[Gmail]/Sent Mail', 'Sent', 'SENT'];
        let folderIndex = 0;

        function tryNextFolder() {
            if (folderIndex >= sentFolders.length) {
                reject(new Error('Could not find sent folder'));
                return;
            }

            console.log(`[IMAP] Trying to open sent folder: ${sentFolders[folderIndex]}`);
            imap.openBox(sentFolders[folderIndex], true, (err, box) => {
                if (err) {
                    console.log(`[IMAP] Failed for ${sentFolders[folderIndex]}, trying next...`);
                    folderIndex++;
                    tryNextFolder();
                    return;
                }
                console.log(`[IMAP] Sent folder opened: ${sentFolders[folderIndex]}, total messages: ${box.messages.total}`);
                fetchEmails(imap, box, resolve, reject);
            });
        }

        tryNextFolder();
    });
}

function fetchEmails(imap, box, resolve, reject) {
    const mails = [];
    const total = box.messages.total;

    if (total === 0) {
        console.log('[IMAP] No messages in folder');
        resolve([]);
        return;
    }

    const start = Math.max(1, total - 9);
    const range = `${start}:${total}`;

    console.log(`[IMAP] Fetching range ${range} of ${total} messages...`);

    const f = imap.seq.fetch(range, { bodies: '' });

    f.on('message', (msg, seqno) => {
        console.log(`[IMAP] Processing message #${seqno}`);
        let buffer = '';

        msg.on('body', (stream) => {
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
        });

        msg.once('end', async () => {
            console.log(`[IMAP] Finished receiving raw message #${seqno}, size=${buffer.length}`);
            try {
                const parsed = await simpleParser(buffer);
                console.log(`[IMAP] Parsed message #${seqno} subject="${parsed.subject}"`);

                const transformedMail = transformMail({
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html,
                    attachments: parsed.attachments
                }, 'imap');

                mails.push(transformedMail);
            } catch (err) {
                console.error(`[IMAP] Error parsing message #${seqno}:`, err);
            }
        });
    });

    f.once('error', (err) => {
        console.error('[IMAP] Fetch error:', err);
        reject(new Error(`Fetch error: ${err.message}`));
    });

    f.once('end', () => {
        console.log(`[IMAP] Fetch complete. Total parsed mails: ${mails.length}`);
        resolve(mails.reverse());
    });
}

function closeAllConnections() {
    console.log('[IMAP] Closing all connections...');
    for (const [key, connection] of connectionPool) {
        try {
            connection.end();
        } catch (e) {}
    }
    connectionPool.clear();
}

process.on('SIGINT', closeAllConnections);
process.on('SIGTERM', closeAllConnections);

module.exports = { getImapSentEmails, getImapInboxEmails, closeAllConnections };
