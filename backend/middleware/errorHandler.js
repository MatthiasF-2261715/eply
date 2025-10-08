js
const logger = require('../services/loggingService');

const errorHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Er is iets misgegaan. Probeer het later opnieuw.'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

module.exports = errorHandler;