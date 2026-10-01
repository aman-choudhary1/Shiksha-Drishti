/**
 * asyncHandler: Wraps an async route handler so thrown errors propagate
 * to Express's error middleware without try/catch boilerplate.
 */
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
