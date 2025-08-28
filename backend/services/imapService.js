const { ImapFlow } = require('imapflow');
const { transformMail } = require('../utils/emailTransform');

const connectionPool = new Map();

function getConnectionKey(imapConfig) {
    return `${imapConfig.email}:${imapConfig.imapServer}:${imapConfig.port}`;
}

function setupImap(imapConfig) {
    return new ImapFlow({
        host: imapConfig.imapServer,
        port: parseInt(imapConfig.port, 10),
        secure: true,
        auth: {
            user: imapConfig.email,
            pass: imapConfig.password
        },
        tls: { rejectUnauthorized: false },
        logger: false
    });
}

async function getImapConnection(imapConfig) {
    const key = getConnectionKey(imapConfig);
    let client = connectionPool.get(key);
    if (client && !client.closed) {
        return client;
    }
    if (client && client.closed) {
        connectionPool.delete(key);
    }

    client = setupImap(imapConfig);

    const timeoutMs = 30000;
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('IMAP connection timeout')), timeoutMs)
    );

    try {
        await Promise.race([client.connect(), timeoutPromise]);
        connectionPool.set(key, client);
        client.on('close', () => {
            connectionPool.delete(key);
        });
        return client;
    } catch (err) {
        try { await client.logout().catch(()=>{}); } catch(e){}
        throw err;
    }
}

async function getImapInboxEmails(imapConfig) {
    const client = await getImapConnection(imapConfig);
    return fetchRecentEmails(client, 'INBOX');
}

async function getImapSentEmails(imapConfig) {
    const client = await getImapConnection(imapConfig);
    const sentFolders = [
        '[Gmail]/Sent Mail',
        '[Gmail]/Sent Messages',
        'Sent',
        'Sent Items',
        'SENT',
        'Sent Messages'
    ];
    for (const folder of sentFolders) {
        try {
            return await fetchRecentEmails(client, folder);
        } catch (_) {
            // probeer volgende
        }
    }
    throw new Error('Could not find sent folder');
}

async function fetchRecentEmails(client, mailbox) {
    try {
        await client.mailboxOpen(mailbox, { readOnly: true });
    } catch (e) {
        throw new Error(`Could not open mailbox ${mailbox}`);
    }

    const exists = client.mailbox.exists || 0;
    if (exists === 0) return [];

    const start = Math.max(1, exists - 9); // laatste 10
    const range = `${start}:${exists}`;

    const mails = [];

    // Fetch envelope + raw bron
    for await (const msg of client.fetch(range, {
        envelope: true,
        uid: true,
        flags: true,
        internalDate: true,
        source: true
    })) {
        const envelope = msg.envelope || {};
        const header = {
            from: (envelope.from || []).map(a => a.address).join(', '),
            to: (envelope.to || []).map(a => a.address).join(', '),
            subject: envelope.subject || '',
            date: envelope.date ? new Date(envelope.date).toUTCString() : ''
        };

        const body = msg.source ? msg.source.toString('utf8') : '';

        const attrs = {
            uid: msg.uid,
            seq: msg.seq,
            flags: msg.flags,
            internalDate: msg.internalDate
        };

        const transformedMail = transformMail(
            { header, body, attrs, content: body },
            'imap'
        );
        mails.push(transformedMail);
    }

    // Zelfde volgorde als originele implementatie (nieuwste bovenaan)
    return mails.reverse();
}

async function closeAllConnections() {
    const closes = [];
    for (const [key, client] of connectionPool) {
        if (!client.closed) {
            closes.push(
                client.logout().catch(() => {})
            );
        }
        connectionPool.delete(key);
    }
    await Promise.all(closes);
}

process.on('SIGINT', () => { closeAllConnections().finally(()=>process.exit(0)); });
process.on('SIGTERM', () => { closeAllConnections().finally(()=>process.exit(0)); });

module.exports = { getImapSentEmails, getImapInboxEmails, closeAllConnections };