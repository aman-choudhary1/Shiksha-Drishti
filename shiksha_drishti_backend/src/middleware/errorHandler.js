/**
 * errorHandler: Global Express error middleware.
 * Never leaks internal stack traces to the client.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isDev = process.env.NODE_ENV === 'development';

  console.error('[SD-Error]', err.message, isDev ? err.stack : '');

  // Validation errors (manually thrown with status)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this data already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Data validation failed: ' + err.detail });
  }

  res.status(500).json({
    error: 'An internal server error occurred',
    ...(isDev && { detail: err.message }),
  });
}

module.exports = errorHandler;
