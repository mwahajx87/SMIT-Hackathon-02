import { AppError } from '../shared/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Zod validation error
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    });
  }

  // Duplicate key (MongoDB 11000)
  if (err?.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this identifier already exists.',
        details: err.keyValue
      }
    });
  }

  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred. Please try again later.',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  });
}
