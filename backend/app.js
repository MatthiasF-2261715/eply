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
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false, // Only use SSL in production
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://www.eply.be'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow no-origin (e.g. same-site tools or server-to-server requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options('*', cors(corsOptions));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
  },
  store: isProduction ? new (require('connect-pg-simple')(session))({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }) : undefined,
  rolling: true
}));

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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