import { Router } from 'express';
import { User, College, Drive, Question, Booking, Payment, Certificate, Setting, Audit } from '../models.js';
import { guard } from '../middleware.js';
import { audit, notify, getSettings } from '../lib.js';
const r = Router(); r.use(guard('admin'));
const page = (req) => { const p = Math.max(+req.query.page || 1, 1), l = Math.min(+req.query.limit || 20, 100); return { skip: (p - 1) * l, limit: l }; };

r.get('/stats', async (req, res) => {
  const [students, mentors, colleges, drives, interviews, pendingMentors, pendingColleges, rev] = await Promise.all([
    User.countDocuments({ role: 'student' }), User.countDocuments({ role: 'mentor' }), College.countDocuments(), Drive.countDocuments(), Booking.countDocuments({ status: 'completed' }),
    User.countDocuments({ role: 'mentor', 'mentor.status': 'pending' }), College.countDocuments({ status: 'pending' }),
    Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: null, t: { $sum: '$amount' } } }])]);
  res.json({ users: await User.countDocuments(), students, mentors, colleges, drives, interviews, revenue: rev[0]?.t || 0, pending: pendingMentors + pendingColleges });
});
r.get('/users', async (req, res) => { const q = req.query.role ? { role: req.query.role } : {};
  res.json({ items: await User.find(q).select('-password').sort('-createdAt').populate('college', 'name').skip(page(req).skip).limit(page(req).limit), total: await User.countDocuments(q) }); });
r.patch('/mentors/:id', async (req, res) => {
  if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  const u = await User.findOneAndUpdate({ _id: req.params.id, role: 'mentor' }, { 'mentor.status': req.body.status }, { new: true }); if (!u) return res.status(404).json({ error: 'Not found' });
  await audit(req.user, `mentor.${req.body.status}`, String(u._id)); await notify(u, 'Verification update', `Your mentor application was ${req.body.status}.`); res.json(u);
});
r.get('/colleges', async (req, res) => res.json(await College.find().sort('-createdAt')));
r.patch('/colleges/:id', async (req, res) => {
  const c = await College.findByIdAndUpdate(req.params.id, { status: req.body.status, subscription: req.body.subscription }, { new: true }); if (!c) return res.status(404).json({ error: 'Not found' });
  await audit(req.user, `college.${req.body.status}`, String(c._id)); res.json(c);
});
r.get('/drives', async (req, res) => res.json(await Drive.find().sort('-createdAt')));
r.post('/drives', async (req, res) => { const d = await Drive.create(req.body); await audit(req.user, 'drive.create', String(d._id)); res.status(201).json(d); });
r.put('/drives/:id', async (req, res) => { const d = await Drive.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); await audit(req.user, 'drive.update', req.params.id); res.json(d); });
r.delete('/drives/:id', async (req, res) => { await Drive.findByIdAndDelete(req.params.id); await audit(req.user, 'drive.delete', req.params.id); res.json({ ok: true }); });
r.get('/questions', async (req, res) => { const q = req.query.topic ? { topic: req.query.topic } : {}; res.json({ items: await Question.find(q).sort('-createdAt').skip(page(req).skip).limit(page(req).limit), total: await Question.countDocuments(q) }); });
r.post('/questions', async (req, res) => {
  const { topic, text, options, correct } = req.body;
  if (!topic || !text || options?.length < 2 || !correct?.length || correct.some((i) => i < 0 || i >= options.length)) return res.status(400).json({ error: 'Provide topic, text, 2+ options and valid correct answer(s)' });
  res.status(201).json(await Question.create({ topic, text, options, correct }));
});
r.delete('/questions/:id', async (req, res) => { await Question.findByIdAndDelete(req.params.id); res.json({ ok: true }); });
r.get('/bookings', async (req, res) => res.json(await Booking.find().populate('student mentor', 'name').populate('slot').sort('-createdAt').limit(100)));
r.get('/payments', async (req, res) => res.json(await Payment.find().populate('user', 'name email').sort('-createdAt').limit(100)));
r.patch('/payments/:id/refund', async (req, res) => { const p = await Payment.findOneAndUpdate({ _id: req.params.id, status: 'captured' }, { status: 'refunded' }, { new: true }); // record only; issue the actual refund in Razorpay dashboard/API
  if (!p) return res.status(409).json({ error: 'Only captured payments can be marked refunded' }); await audit(req.user, 'payment.refund', String(p._id)); res.json(p); });
r.get('/certificates', async (req, res) => res.json(await Certificate.find().populate('student', 'name').populate('drive', 'title').sort('-createdAt').limit(100)));
r.patch('/certificates/:id', async (req, res) => { const c = await Certificate.findByIdAndUpdate(req.params.id, { status: req.body.status === 'revoked' ? 'revoked' : 'valid' }, { new: true }); await audit(req.user, 'certificate.' + c.status, c.certId); res.json(c); });
r.get('/settings', async (req, res) => res.json(await getSettings()));
r.put('/settings', async (req, res) => { const { thresholds, minCertLevel, mentorShare } = req.body;
  if (!Array.isArray(thresholds) || !thresholds.every((t) => t.name && t.min >= 0 && t.min <= 100)) return res.status(400).json({ error: 'Invalid thresholds' });
  await Setting.findOneAndUpdate({ key: 'readiness' }, { value: { thresholds, minCertLevel, mentorShare } }, { upsert: true }); await audit(req.user, 'settings.update', 'readiness'); res.json(await getSettings()); });
r.get('/audit', async (req, res) => res.json(await Audit.find().populate('actor', 'name').sort('-createdAt').limit(100)));
export default r;
