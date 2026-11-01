import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, College, Notification } from '../models.js';
import { sign, guard } from '../middleware.js';
import { pick, safe, notify } from '../lib.js';
const r = Router();
const base = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
  phone: z.string().optional(),
});

r.post('/register', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const role = body.role;
  if (!['student', 'mentor', 'college'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const b = role === 'college'
    ? base.omit({ name: true }).extend({ collegeName: z.string().trim().min(2) }).transform(({ collegeName, ...rest }) => ({ ...rest, name: collegeName })).parse(body)
    : base.parse(body);
  if (await User.exists({ email: b.email })) return res.status(409).json({ error: 'Email already registered' });
  const doc = { ...b, password: await bcrypt.hash(b.password, 10), role };
  if (role === 'student') doc.profile = pick(body.profile, ['college', 'degree', 'branch', 'gradYear', 'targetRole', 'linkedin', 'github']);
  if (role === 'mentor') doc.mentor = { ...pick(body.mentor, ['company', 'title', 'years', 'specialization', 'expertise', 'linkedin']), status: 'pending' };
  const user = await User.create(doc);
  if (role === 'college') {
    try {
      const c = await College.create({ name: b.name, email: b.email, owner: user._id });
      user.college = c._id;
      await user.save();
    } catch (error) {
      await College.deleteMany({ owner: user._id });
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  }
  sign(user, res);
  await notify(user, 'Welcome to SkillBridge', role === 'student' ? 'Your account is ready.' : 'Your application is pending admin approval.');
  res.status(201).json(safe(user));
});
r.post('/login', async (req, res) => {
  const { email, password } = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string() }).parse(req.body || {});
  const u = await User.findOne({ email });
  if (!u || !(await bcrypt.compare(password, u.password))) return res.status(401).json({ error: 'Incorrect email or password' });
  sign(u, res); res.json(safe(u));
});
r.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
r.get('/me', guard(), async (req, res) => res.json(safe(await req.user.populate('college'))));
r.put('/me', guard('student', 'mentor'), async (req, res) => {
  const u = req.user, b = req.body;
  Object.assign(u, pick(b, ['name', 'phone']));
  if (u.role === 'student') {
    const p = pick(b.profile, ['college', 'degree', 'branch', 'gradYear', 'targetRole', 'linkedin', 'github', 'resume']);
    for (const key of ['skills', 'interests']) {
      if (typeof b.profile?.[key] === 'string') p[key] = b.profile[key].split(',').map((s) => s.trim()).filter(Boolean);
    }
    u.profile = { ...u.profile?.toObject?.(), ...p };
  } else Object.assign(u.mentor, pick(b.mentor, ['company', 'title', 'years', 'specialization', 'expertise', 'linkedin', 'photo', 'rate']));
  await u.save(); res.json(safe(u));
});
r.get('/notifications', guard(), async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort('-createdAt').limit(30)));
r.post('/notifications/read', guard(), async (req, res) => { await Notification.updateMany({ user: req.user._id }, { read: true }); res.json({ ok: true }); });
export default r;
