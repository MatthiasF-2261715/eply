const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getUserIdByEmail(email) {
  if (!email) throw new Error('Email is required');
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['matthias@eply.be']);
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

module.exports = { getUserIdByEmail, getAssistantByEmail };