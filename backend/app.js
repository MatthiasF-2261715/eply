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

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction, // zet op true in productie
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
    rolling: true // Reset expiration on activity
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
  });
  
  pool.connect()
    .then(client => {
      client.release();
      app.listen(process.env.PORT, () => {
        console.log(`Server running on http://localhost:${process.env.PORT}`);
      });
    })
    .catch(err => {
      console.error('Database connection error:', err.stack);
      process.exit(1);
    });
  