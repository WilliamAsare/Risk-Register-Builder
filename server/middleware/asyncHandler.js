/**
 * Wraps an Express route handler to catch any synchronous or asynchronous errors
 * and forward them to Express's error handling middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);
      if (result && typeof result.catch === 'function') {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { asyncHandler };
