const Imap = require('imap');
const { transformMail } = require('../utils/emailTransform');

// Connection pool to reuse IMAP connections
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
        return connection;
    }
    
    // Clean up old connection if exists
    if (connection) {
        try {
            connection.end();
        } catch (e) {
            // Ignore cleanup errors
        }
        connectionPool.delete(connectionKey);
    }
    
    return new Promise((resolve, reject) => {
        const imap = setupImap(imapConfig);
        let timeoutId = setupTimeout(imap, reject);

        imap.once('ready', function () {
            clearTimeout(timeoutId);
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
        } catch (e) {
            // Ignore cleanup errors
        }
        reject(new Error('IMAP connection timeout'));
    }, 30000);
}

function setupImapListeners(imap, timeoutId, reject, connectionKey) {
    imap.once('error', (err) => {
        clearTimeout(timeoutId);
        if (connectionKey) {
            connectionPool.delete(connectionKey);
        }
        reject(new Error(`IMAP error: ${err.message}`));
    });

    imap.once('end', () => {
        clearTimeout(timeoutId);
        if (connectionKey) {
            connectionPool.delete(connectionKey);
        }
    });

    imap.once('close', () => {
        if (connectionKey) {
            connectionPool.delete(connectionKey);
        }
    });
}

function openInbox(imap) {
    return new Promise((resolve, reject) => {
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                reject(new Error('Could not open inbox'));
                return;
            }
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

            imap.openBox(sentFolders[folderIndex], true, (err, box) => {
                if (err) {
                    folderIndex++;
                    tryNextFolder();
                    return;
                }
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
        resolve([]);
        return;
    }
    
    const start = Math.max(1, total - 9);
    const range = `${start}:${total}`;

    const f = imap.seq.fetch(range, {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT', ''],
        struct: true
    });

    f.on('message', (msg) => {
        let mail = { header: null, body: '', rawBody: '', structure: null };

        msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            stream.on('end', () => {
                if (info.which === 'TEXT') {
                    mail.body = buffer;
                } else if (info.which === '') {
                    // Full message body
                    mail.rawBody = buffer;
                } else {
                    mail.header = Imap.parseHeader(buffer);
                }
            });
        });

        msg.once('attributes', (attrs) => {
            mail.attrs = attrs;
            mail.structure = attrs.struct;
        });

        msg.once('end', () => {
            // Process the email body based on structure
            const processedBody = processEmailBody(mail);
            const transformedMail = transformMail({ ...mail, content: processedBody }, 'imap');
            mails.push(transformedMail);
        });
    });

    f.once('error', (err) => {
        reject(new Error(`Fetch error: ${err.message}`));
    });

    f.once('end', () => {
        resolve(mails.reverse());
    });
}

function processEmailBody(mail) {
    try {
        // If we have structure info, try to decode properly
        if (mail.structure && mail.structure.length > 0) {
            const mainPart = mail.structure[0];
            
            // Check if it's base64 encoded
            if (mainPart.encoding === 'BASE64' || mainPart.encoding === 'base64') {
                try {
                    const decoded = Buffer.from(mail.body, 'base64').toString('utf8');
                    return decoded;
                } catch (e) {
                    console.log('Failed to decode base64:', e.message);
                }
            }
            
            // Check if it's quoted-printable
            if (mainPart.encoding === 'QUOTED-PRINTABLE' || mainPart.encoding === 'quoted-printable') {
                try {
                    return decodeQuotedPrintable(mail.body);
                } catch (e) {
                    console.log('Failed to decode quoted-printable:', e.message);
                }
            }
        }
        
        // If the body looks like base64 (long strings of random characters), try to decode
        if (mail.body && isLikelyBase64(mail.body)) {
            try {
                const decoded = Buffer.from(mail.body, 'base64').toString('utf8');
                // Check if decoded content makes sense
                if (decoded.length > 0 && !isLikelyBase64(decoded)) {
                    return decoded;
                }
            } catch (e) {
                console.log('Auto base64 decode failed:', e.message);
            }
        }
        
        return mail.body || '';
    } catch (error) {
        console.error('Error processing email body:', error);
        return mail.body || '';
    }
}

function isLikelyBase64(str) {
    if (!str || str.length < 50) return false;
    
    // Base64 pattern check
    const base64Regex = /^[A-Za-z0-9+/\r\n]+={0,2}$/;
    const cleanStr = str.replace(/\r\n/g, '').replace(/\s/g, '');
    
    return base64Regex.test(cleanStr) && cleanStr.length > 100;
}

function decodeQuotedPrintable(str) {
    return str
        .replace(/=\r?\n/g, '') // Remove soft line breaks
        .replace(/=([0-9A-F]{2})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
}

// Cleanup function to close all connections
function closeAllConnections() {
    for (const [key, connection] of connectionPool) {
        try {
            connection.end();
        } catch (e) {
            // Ignore cleanup errors
        }
    }
    connectionPool.clear();
}

// Cleanup on process exit
process.on('SIGINT', closeAllConnections);
process.on('SIGTERM', closeAllConnections);

module.exports = { getImapSentEmails, getImapInboxEmails, closeAllConnections };