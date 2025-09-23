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
        bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
        struct: true
    });

    f.on('message', (msg) => {
        let mail = { header: null, structure: null };

        msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            stream.on('end', () => {
                mail.header = Imap.parseHeader(buffer);
            });
        });

        msg.once('attributes', (attrs) => {
            mail.attrs = attrs;
            mail.structure = attrs.struct;
        });

        msg.once('end', () => {
            // Fetch the actual body based on structure
            fetchMessageBody(imap, attrs.uid, mail.structure)
                .then(body => {
                    const transformedMail = transformMail({ ...mail, content: body }, 'imap');
                    mails.push(transformedMail);
                })
                .catch(err => {
                    console.error('Error fetching message body:', err);
                    const transformedMail = transformMail({ ...mail, content: '' }, 'imap');
                    mails.push(transformedMail);
                });
        });
    });

    let processedCount = 0;
    const expectedCount = Math.min(10, total);

    f.once('error', (err) => {
        reject(new Error(`Fetch error: ${err.message}`));
    });

    f.once('end', () => {
        // Wait for all bodies to be processed
        const checkComplete = () => {
            if (mails.length >= expectedCount) {
                resolve(mails.reverse());
            } else {
                setTimeout(checkComplete, 100);
            }
        };
        checkComplete();
    });
}

function fetchMessageBody(imap, uid, structure) {
    return new Promise((resolve, reject) => {
        // Find the best text part
        const textPart = findTextPart(structure);
        if (!textPart) {
            resolve('');
            return;
        }

        const f = imap.fetch(uid, {
            bodies: textPart.partID || '1'
        });

        let body = '';
        f.on('message', (msg) => {
            msg.on('body', (stream) => {
                let buffer = '';
                stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                stream.on('end', () => {
                    body = decodeBody(buffer, textPart.encoding);
                });
            });
        });

        f.once('error', reject);
        f.once('end', () => resolve(body));
    });
}

function findTextPart(struct, partID = '') {
    if (!struct || !Array.isArray(struct)) return null;

    for (let i = 0; i < struct.length; i++) {
        const part = struct[i];
        const currentPartID = partID ? `${partID}.${i + 1}` : `${i + 1}`;

        if (part.type === 'text' && part.subtype === 'plain') {
            return { ...part, partID: currentPartID };
        }

        if (part.type === 'text' && part.subtype === 'html') {
            return { ...part, partID: currentPartID };
        }

        // Check nested parts
        if (Array.isArray(part)) {
            const nested = findTextPart(part, currentPartID);
            if (nested) return nested;
        }
    }

    return null;
}

function decodeBody(body, encoding) {
    if (!body) return '';

    try {
        switch (encoding?.toLowerCase()) {
            case 'base64':
                return Buffer.from(body, 'base64').toString('utf8');
            case 'quoted-printable':
                return decodeQuotedPrintable(body);
            default:
                return body;
        }
    } catch (error) {
        console.error('Error decoding body:', error);
        return body;
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