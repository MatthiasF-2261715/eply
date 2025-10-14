require('dotenv').config();

const express = require('express');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const { cleanupExpiredSessions } = require('./database');

const app = express();

// Add this before other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.eply.be", "https://www.eply.be"],
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false, // Only use SSL in production
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://eplydevelopment.vercel.app',
    'https://www.eply.be'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

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
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Move routes before error handlers
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// Move error handlers to the end
// 404 handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler should be last
app.use(errorHandler);

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
      const port = process.env.PORT || 4000;
      app.listen(port, '0.0.0.0', () => {
      });
    })
    .catch(err => {
      console.error('Database connection error:', err.stack);
      process.exit(1);
    });

// Now daily session deletion
if (isProduction) {
  setInterval(async () => {
    await cleanupExpiredSessions();
  }, 24 * 60 * 60 * 1000);
}