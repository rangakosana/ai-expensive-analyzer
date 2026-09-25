import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  // Handle SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload in request body' });
  }

  // Handle custom status errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR ${status}] ${req.method} ${req.url}:`, err);

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

export default {
  errorHandler,
  notFoundHandler,
};
