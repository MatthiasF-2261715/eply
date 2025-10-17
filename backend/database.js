const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Encryption helpers for IMAP passwords
function encryptPassword(password) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPassword(encryptedData) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function getUserIdByEmail(email) {
  if (!email) throw new Error('Email is required');
  const normalizedEmail = email.toLowerCase();
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  return userResult.rows[0].id;
}

async function getAssistantByEmail(email) {
  const userID = await getUserIdByEmail(email);
  const result = await pool.query('SELECT * FROM ai_assistants WHERE related_user_id = $1', [userID]);
  if (result.rows.length === 0) {
    throw new Error('Assistant not found for user');
  }
  return result.rows[0];
}

async function getUserById(userId) {
  const result = await pool.query('SELECT id, first, last, email FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  return result.rows[0];
}

async function isUserWhitelisted(email) {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase();
  const result = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
  return result.rowCount > 0;
}

async function createUser(firstName, lastName, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
    [firstName, lastName, email, hashedPassword]
  );
  return result.rows[0].id;
}

async function validateUser(email, password) {
  const result = await pool.query(
    'SELECT id, password FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);
  
  return validPassword ? user.id : null;
}

async function deleteSession(sessionId) {
  try {
    await pool.query('DELETE FROM user_sessions WHERE sid = $1', [sessionId]);
    return true;
  } catch (err) {
    console.error('Error deleting session:', err);
    return false;
  }
}

async function cleanupExpiredSessions() {
  try {
    await pool.query('DELETE FROM user_sessions WHERE expire < NOW()');
    return true;
  } catch (err) {
    console.error('Session cleanup error:', err);
    return false;
  }
}

async function saveImapSettings(server, port, email, password, userId) {
  const encryptedPassword = encryptPassword(password);
  const result = await pool.query(
    'INSERT INTO imap (server, port, mail, password, related_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [server, port, email, encryptedPassword, userId]
  );
  return result.rows[0].id;
}

async function getUserEmails(userId) {
  const result = await pool.query(
    'SELECT mail FROM imap WHERE related_user_id = $1',
    [userId]
  );
  return result.rows.map(row => row.mail);
}

async function getImapCredentials() {
    const result = await pool.query(
        'SELECT server, port, mail, password FROM imap'
    );
    
    return result.rows.map(row => ({
        server: row.server,
        port: row.port,
        email: row.mail,
        password: decryptPassword(row.password)
    }));
}

async function getUserSignature(userId) {
  const result = await pool.query(
    'SELECT signature FROM user_signatures WHERE related_user_id = $1',
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0].signature : '';
}

async function saveUserSignature(userId, signature) {
  const exists = await pool.query(
    'SELECT 1 FROM user_signatures WHERE related_user_id = $1',
    [userId]
  );
  if (exists.rows.length > 0) {
    await pool.query(
      'UPDATE user_signatures SET signature = $1 WHERE related_user_id = $2',
      [signature, userId]
    );
  } else {
    await pool.query(
      'INSERT INTO user_signatures (related_user_id, signature) VALUES ($1, $2)',
      [userId, signature]
    );
  }
  return true;
}

module.exports = { 
  getAssistantByEmail, 
  getUserById,
  isUserWhitelisted, 
  createUser,
  validateUser,
  deleteSession,
  cleanupExpiredSessions,
  saveImapSettings,
  getUserEmails,
  getImapCredentials,
  getUserSignature,
  saveUserSignature
};