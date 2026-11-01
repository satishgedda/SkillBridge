import { Router } from 'express';
import { Slot, Booking, Evaluation, Enrollment, User } from '../models.js';
import { guard } from '../middleware.js';
import { recordRound, notify, getSettings } from '../lib.js';
import { evalTotal } from '../scoring.js';
const r = Router(); r.use(guard('mentor'));
const approved = (req, res, next) => (req.user.mentor.status === 'approved' ? next() : res.status(403).json({ error: 'Your account must be verified by an admin first' }));

r.get('/summary', async (req, res) => {
  const bs = await Booking.find({ mentor: req.user._id }).populate('slot'); const s = await getSettings();
  const done = bs.filter((b) => b.status === 'completed'); const ev = await Evaluation.countDocuments({ mentor: req.user._id });
  res.json({ status: req.user.mentor.status, upcoming: bs.filter((b) => ['requested', 'accepted'].includes(b.status)).length, completed: done.length, evaluations: ev,
    earnings: Math.round(done.reduce((t, b) => t + b.price * s.mentorShare, 0)), slots: await Slot.countDocuments({ mentor: req.user._id, start: { $gt: new Date() } }) });
});
r.get('/slots', async (req, res) => res.json(await Slot.find({ mentor: req.user._id, start: { $gt: new Date() } }).sort('start')));
r.post('/slots', approved, async (req, res) => {
  const start = new Date(req.body.start), mins = Math.min(Math.max(+req.body.minutes || 45, 15), 120); // ISO/UTC from client, shown in each user's local time
  if (isNaN(start) || start < new Date()) return res.status(400).json({ error: 'Choose a future time' });
  const end = new Date(start.getTime() + mins * 60000);
  if (await Slot.exists({ mentor: req.user._id, start: { $lt: end }, end: { $gt: start } })) return res.status(409).json({ error: 'Overlaps an existing slot' });
  res.status(201).json(await Slot.create({ mentor: req.user._id, start, end }));
});
r.delete('/slots/:id', async (req, res) => { const s = await Slot.findOneAndDelete({ _id: req.params.id, mentor: req.user._id, booked: false }); s ? res.json({ ok: true }) : res.status(409).json({ error: 'Booked slots cannot be deleted' }); });
r.get('/bookings', async (req, res) => res.json(await Booking.find({ mentor: req.user._id }).populate('slot').populate('student', 'name email profile').populate({ path: 'enrollment', populate: { path: 'drive', select: 'title rounds' } }).sort('-createdAt')));
r.patch('/bookings/:id', approved, async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, mentor: req.user._id, status: 'requested' }); if (!b) return res.status(409).json({ error: 'Booking cannot be changed' });
  if (req.body.action === 'accept') b.status = 'accepted'; else { b.status = 'rejected'; await Slot.updateOne({ _id: b.slot }, { booked: false }); }
  await b.save(); await notify(await User.findById(b.student), `Interview ${b.status}`, `Your mentor ${b.status} the request.`); res.json(b);
});
r.post('/bookings/:id/evaluate', approved, async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, mentor: req.user._id, status: 'accepted' }).populate('slot');
  if (!b) return res.status(409).json({ error: 'Only accepted bookings can be evaluated' });
  if (b.slot.start > new Date()) return res.status(409).json({ error: 'The interview has not started yet' });
  const e = await Enrollment.findById(b.enrollment).populate('drive'); const def = e.drive.rounds.find((d) => d.order === b.order);
  const type = def.interviewType || 'technical'; const total = evalTotal(type, req.body.scores);
  const ev = await Evaluation.create({ booking: b._id, enrollment: e._id, student: b.student, mentor: req.user._id, type, scores: req.body.scores, total,
    ...Object.fromEntries(['feedback', 'strengths', 'weaknesses', 'recommendations'].map((k) => [k, String(req.body[k] || '')])), categoryNotes: req.body.categoryNotes });
  b.status = 'completed'; await b.save(); await recordRound(e, e.drive, b.order, total);
  await notify(await User.findById(b.student), 'Interview feedback published', `Scored ${total}/100 for ${def.name}.`); res.status(201).json(ev);
});
export default r;
