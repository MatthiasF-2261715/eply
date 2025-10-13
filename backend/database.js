const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getUserIdByEmail(email) {
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

async function createUser(firstName, lastName, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
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

module.exports = { 
  getAssistantByEmail, 
  isUserWhitelisted, 
  createUser,
  validateUser
};