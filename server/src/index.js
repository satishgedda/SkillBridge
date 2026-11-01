import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import auth from './routes/auth.js';
import pub from './routes/public.js';
import student from './routes/student.js';
import mentor from './routes/mentor.js';
import college from './routes/college.js';
import admin from './routes/admin.js';
import payments, { webhook } from './routes/payments.js';

const placeholder = (v) => !v || /^(change-me|replace-me|your-|example|<.*>|\*+)/i.test(v.trim());
const mongoUri = process.env.MONGO_URI?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();
if (placeholder(jwtSecret) || jwtSecret.length < 24) throw new Error('Set a real JWT_SECRET in server/.env (minimum 24 characters).');
if (placeholder(mongoUri) || !/^mongodb(\+srv)?:\/\//i.test(mongoUri)) throw new Error('Set a valid MONGO_URI in server/.env using your MongoDB Atlas connection string. Do not commit real credentials to source control.');
const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhook); // raw body needed for signature check
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth); app.use('/api/public', pub); app.use('/api/student', student); app.use('/api/mentor', mentor);
app.use('/api/college', college); app.use('/api/admin', admin); app.use('/api/payments', payments);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  if (err.code === 11000) return res.status(409).json({ error: 'A record with that value already exists' });
  if (err.name === 'CastError' || err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  if (err.message?.startsWith('Score for') || err.message === 'Unknown interview type') return res.status(400).json({ error: err.message });
  console.error(err); res.status(500).json({ error: 'Something went wrong' });
});
try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
} catch (error) {
  console.error(`MongoDB connection failed (${error.name}). Check MONGO_URI, Atlas network access, and database credentials.`);
  process.exit(1);
}
app.listen(process.env.PORT || 5000, () => console.log('SkillBridge API on', process.env.PORT || 5000));
