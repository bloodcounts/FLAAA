const { StatusCodes } = require('http-status-codes');

// eslint-disable-next-line no-unused-vars
function errorHandler(logger) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    logger.error({ message: err.message, stack: err.stack, path: req.path });

    const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    res.status(status).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  };
}

module.exports = errorHandler;
