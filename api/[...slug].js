import 'express';
import 'pg';
import 'bcryptjs';
import 'jsonwebtoken';
import 'cors';
import 'zod';
import 'dotenv';
import 'morgan';
import '@google/genai';

import app from '../server/server.js';

export default function handler(req, res) {
  return app(req, res);
}
