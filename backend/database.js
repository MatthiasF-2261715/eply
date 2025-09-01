const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getUserIdByEmail(email) {
  console.log('Fetching user ID for email:', email);
  if (!email) throw new Error('Email is required');
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
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

async function isUserWhitelisted(email) {
  if (!email) return false;
  const result = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
  return result.rowCount > 0;
}

module.exports = { getAssistantByEmail, isUserWhitelisted };