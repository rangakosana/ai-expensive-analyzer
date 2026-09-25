import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

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
      role: decoded.role || 'user',
    };

    next();
  });
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Access denied. Authentication required.' });
    }

    // If role in token is not admin, verify against database to support existing active sessions
    if (req.user.role !== 'admin') {
      const dbUser = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (dbUser.rows.length > 0 && dbUser.rows[0].role === 'admin') {
        req.user.role = 'admin';
      }
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticateToken;

