require('dotenv').config();

const express = require('express');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const app = express();

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

// Update CORS to allow Railway domain and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://eply.vercel.app', 
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: isProduction ? 'none' : 'lax' // Important for Railway cross-origin requests
      },
    rolling: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// 404 handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler (JSON response)
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {}
    });
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? {
      rejectUnauthorized: false
    } : false, // Only use SSL in production
  });
  
  pool.connect()
    .then(client => {
      client.release();
      // Listen on all interfaces for Railway
      const port = process.env.PORT || 4000;
      app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err.stack);
      process.exit(1);
    });