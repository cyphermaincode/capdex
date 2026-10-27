function errorHandler(err, req, res, next) {
  console.error('ERROR OCCURRED:', err.message, err.stack);
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : status === 403 ? 'FORBIDDEN' : status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR');
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(status).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    }
  });
}

module.exports = errorHandler;
