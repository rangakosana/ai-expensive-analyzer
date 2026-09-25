import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Authentication token has expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Malformed authentication token payload.' });
    }

    // Attach verified user payload strictly to req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  });
};

export default authenticateToken;
