/**
 * Global API error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = {
  errorHandler,
};

