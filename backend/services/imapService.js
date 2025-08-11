const Imap = require('imap');
const { transformMail } = require('../utils/emailTransform');

async function getImapEmails(imapConfig) {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: imapConfig.email,
            password: imapConfig.password,
            host: imapConfig.imapServer,
            port: parseInt(imapConfig.port, 10),
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 5000
        });

        let timeoutId = setTimeout(() => {
            imap.end();
            reject(new Error('IMAP connection timeout'));
        }, 30000);

        imap.once('ready', function () {
            clearTimeout(timeoutId);
            tryFindSentFolder(imap, resolve, reject);
        });

        imap.once('error', (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`IMAP error: ${err.message}`));
        });

        imap.once('end', () => {
            clearTimeout(timeoutId);
        });

        imap.connect();
    });
}

function tryFindSentFolder(imap, resolve, reject) {
    const sentFolders = ['[Gmail]/Sent Mail', 'Sent', 'SENT'];
    let folderIndex = 0;

    function tryNextFolder() {
        if (folderIndex >= sentFolders.length) {
            imap.end();
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
}

function fetchEmails(imap, box, resolve, reject) {
    const mails = [];
    const total = box.messages.total;
    const start = Math.max(1, total - 4);
    const range = `${start}:${total}`;

    const f = imap.seq.fetch(range, {
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
        struct: true
    });

    f.on('message', (msg) => {
        let mail = { header: null, body: '' };

        msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
            stream.on('end', () => {
                if (info.which === 'TEXT') {
                    mail.body = buffer;
                } else {
                    mail.header = Imap.parseHeader(buffer);
                }
            });
        });

        msg.once('attributes', (attrs) => {
            mail.attrs = attrs;
        });

        msg.once('end', () => {
            const transformedMail = transformMail({ ...mail, content: mail.body }, 'imap');
            mails.push(transformedMail);
        });
    });

    f.once('error', (err) => {
        imap.end();
        reject(new Error(`Fetch error: ${err.message}`));
    });

    f.once('end', () => {
        imap.end();
        resolve(mails.reverse());
    });
}

module.exports = { getImapEmails };