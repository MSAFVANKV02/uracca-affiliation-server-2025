export const errorHandler = (err, req, res, next) => {
  console.error("Error caught by errorHandler:", err); // Debugging

  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    error: err.name || "UnknownError",
    message: err.message || "Internal Server Error",
  };

  // Handle MongoDB Duplicate Key Error
  if (err.code === 11000) {
    response.error = 'DuplicateKeyError';
    response.message = `Duplicate field: ${Object.keys(err.keyValue).join(', ')}`;
    return res.status(409).json(response);
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    response.error = 'ValidationError';
    response.message = err.message;
    return res.status(400).json(response);
  }

  // Add stack only in development mode
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
