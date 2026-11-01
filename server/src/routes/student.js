import { Router } from 'express';
import { Drive, Enrollment, Question, Attempt, Slot, Booking, Evaluation, Certificate, Payment, User } from '../models.js';
import { guard } from '../middleware.js';
import { enroll, recordRound, canTake, notify, getSettings } from '../lib.js';
import { levelIndex } from '../scoring.js';
import crypto from 'crypto';
const r = Router(); r.use(guard('student'));
const mine = async (req) => Enrollment.findOne({ _id: req.params.id, student: req.user._id }).populate('drive');

r.get('/summary', async (req, res) => {
  const p = req.user.profile?.toObject?.() || {}; const f = ['college', 'degree', 'branch', 'gradYear', 'targetRole', 'linkedin', 'github', 'resume'];
  const enrs = await Enrollment.find({ student: req.user._id }).populate('drive', 'title');
  const upcoming = await Booking.find({ student: req.user._id, status: { $in: ['requested', 'accepted'] } }).populate('slot').populate('mentor', 'name');
  res.json({ completion: Math.round((f.filter((k) => p[k]).length + (p.skills?.length ? 1 : 0)) / (f.length + 1) * 100), enrollments: enrs, upcoming,
    certificates: await Certificate.countDocuments({ student: req.user._id }), latest: enrs.filter((e) => e.overall != null).at(-1) || null });
});
r.get('/enrollments', async (req, res) => res.json(await Enrollment.find({ student: req.user._id }).populate('drive')));
r.get('/enrollments/:id', async (req, res) => { const e = await mine(req); e ? res.json(e) : res.status(404).json({ error: 'Not found' }); });
r.post('/drives/:id/enroll', async (req, res) => {
  const d = await Drive.findOne({ _id: req.params.id, published: true }); if (!d) return res.status(404).json({ error: 'Drive not found' });
  if (d.price > 0) return res.status(402).json({ error: 'Payment required', pay: true });
  res.status(201).json(await enroll(req.user._id, d));
});

// MCQ rounds
r.post('/enrollments/:id/rounds/:order/start', async (req, res) => {
  const e = await mine(req); const order = +req.params.order; if (!e) return res.status(404).json({ error: 'Not found' });
  const def = e.drive.rounds.find((x) => x.order === order);
  if (!def || def.kind !== 'mcq') return res.status(400).json({ error: 'Not an assessment round' });
  if (!canTake(e, order)) return res.status(403).json({ error: 'Complete the previous round first' });
  let a = await Attempt.findOne({ enrollment: e._id, order, submittedAt: null, endsAt: { $gt: new Date() } });
  if (!a) {
    const qs = await Question.aggregate([{ $match: { topic: { $in: def.topics } } }, { $sample: { size: def.questionCount || 10 } }]);
    if (!qs.length) return res.status(409).json({ error: 'No questions available for this round yet' });
    a = await Attempt.create({ enrollment: e._id, student: req.user._id, order, questions: qs.map((q) => q._id), startedAt: new Date(), endsAt: new Date(Date.now() + def.duration * 60000) });
  }
  const qs = await Question.find({ _id: { $in: a.questions } });
  res.json({ attemptId: a._id, endsAt: a.endsAt, name: def.name, questions: a.questions.map((id) => { const q = qs.find((x) => x._id.equals(id));
    return { id: q._id, topic: q.topic, text: q.text, options: q.options, multi: q.correct.length > 1 }; }) });
});
r.post('/attempts/:id/submit', async (req, res) => {
  const a = await Attempt.findOne({ _id: req.params.id, student: req.user._id });
  if (!a || a.submittedAt) return res.status(409).json({ error: 'Attempt already submitted or not found' });
  if (Date.now() > a.endsAt.getTime() + 120000) return res.status(410).json({ error: 'Time is over for this attempt' });
  const qs = await Question.find({ _id: { $in: a.questions } }); const ans = req.body.answers || {};
  let got = 0, tot = 0; const topic = {};
  for (const q of qs) {
    const given = [...(ans[q._id] || [])].map(Number).sort().join(), want = [...q.correct].sort().join(); const ok = given === want;
    tot += q.points; if (ok) got += q.points; topic[q.topic] ??= [0, 0]; topic[q.topic][1] += q.points; if (ok) topic[q.topic][0] += q.points;
  }
  const score = tot ? (got / tot) * 100 : 0;
  a.submittedAt = new Date(); a.score = score; a.answers = ans;
  a.topicScores = Object.fromEntries(Object.entries(topic).map(([k, [g, t]]) => [k, Math.round((g / t) * 100)])); await a.save();
  const e = await Enrollment.findById(a.enrollment).populate('drive'); await recordRound(e, e.drive, a.order, score);
  await notify(req.user, 'Assessment result ready', `You scored ${Math.round(score)}% in ${e.drive.title}.`);
  res.json({ score: Math.round(score), passed: e.rounds.find((x) => x.order === a.order).status === 'passed', topicScores: a.topicScores });
});

// Interview booking
r.post('/bookings', async (req, res) => {
  const { slotId, enrollmentId, order } = req.body; const e = await Enrollment.findOne({ _id: enrollmentId, student: req.user._id }).populate('drive');
  const def = e?.drive.rounds.find((x) => x.order === +order);
  if (!def || def.kind !== 'interview' || !canTake(e, +order)) return res.status(403).json({ error: 'This interview round is not available yet' });
  if (await Booking.exists({ enrollment: e._id, order: +order, status: { $in: ['awaiting_payment', 'requested', 'accepted'] } })) return res.status(409).json({ error: 'You already have an active booking for this round' });
  const candidate = await Slot.findOne({ _id: slotId, booked: false, start: { $gt: new Date() } });
  if (!candidate) return res.status(409).json({ error: 'That slot is no longer available' });
  const m = await User.findOne({ _id: candidate.mentor, role: 'mentor', 'mentor.status': 'approved' });
  if (!m) return res.status(409).json({ error: 'That interviewer is not currently available for bookings' });
  const slot = await Slot.findOneAndUpdate({ _id: candidate._id, mentor: m._id, booked: false, start: { $gt: new Date() } }, { booked: true }); // atomic: prevents double booking
  if (!slot) return res.status(409).json({ error: 'That slot is no longer available' });
  try {
    const b = await Booking.create({ student: req.user._id, mentor: slot.mentor, slot: slot._id, enrollment: e._id, order: +order, price: m.mentor.rate || 0,
      status: m.mentor.rate > 0 ? 'awaiting_payment' : 'requested', meetingUrl: `https://meet.jit.si/skillbridge-${crypto.randomBytes(8).toString('hex')}` });
    if (b.status === 'requested') await notify(m, 'New interview request', `${req.user.name} requested a slot.`);
    res.status(201).json(b);
  } catch (err) { await Slot.updateOne({ _id: slot._id }, { booked: false }); throw err; }
});
r.get('/bookings', async (req, res) => res.json(await Booking.find({ student: req.user._id }).populate('slot').populate('mentor', 'name mentor').populate({ path: 'enrollment', populate: { path: 'drive', select: 'title rounds' } }).sort('-createdAt')));
r.patch('/bookings/:id/cancel', async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, student: req.user._id }).populate('slot');
  if (!b || !['awaiting_payment', 'requested', 'accepted'].includes(b.status)) return res.status(409).json({ error: 'Cannot cancel this booking' });
  if (b.slot.start - Date.now() < 2 * 3600e3) return res.status(409).json({ error: 'Bookings can be cancelled up to 2 hours before the start' });
  b.status = 'cancelled'; await b.save(); await Slot.updateOne({ _id: b.slot._id }, { booked: false }); res.json(b); // reschedule = cancel + book a new slot
});

// Report
r.get('/enrollments/:id/report', async (req, res) => {
  const e = await mine(req); if (!e) return res.status(404).json({ error: 'Not found' });
  const evs = await Evaluation.find({ enrollment: e._id }); const ats = await Attempt.find({ enrollment: e._id, submittedAt: { $ne: null } });
  const cats = {}, topics = {};
  for (const ev of evs) for (const [k, v] of Object.entries(ev.scores)) (cats[k] ??= []).push(v * 10);
  for (const a of ats) for (const [k, v] of Object.entries(a.topicScores || {})) (topics[k] ??= []).push(v);
  const avg = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v.reduce((s, x) => s + x, 0) / v.length)]));
  const skills = { ...avg(topics), ...avg(cats) };
  const settings = await getSettings(); const weak = Object.keys(skills).filter((k) => skills[k] < 60), strong = Object.keys(skills).filter((k) => skills[k] >= 75);
  const needsRetake = e.level == null || levelIndex(e.level, settings.thresholds) < levelIndex(settings.minCertLevel, settings.thresholds);
  res.json({ student: req.user.name, drive: e.drive.title, rounds: e.drive.rounds.map((d) => ({ ...d.toObject(), ...e.rounds.find((x) => x.order === d.order)?.toObject() })),
    overall: e.overall, level: e.level, skills, weak, strong, evaluations: evs.map((x) => ({ type: x.type, total: x.total, feedback: x.feedback, strengths: x.strengths, weaknesses: x.weaknesses, recommendations: x.recommendations })),
    retakeAfter: needsRetake && e.completedAt ? new Date(e.completedAt.getTime() + 30 * 864e5) : null, certEligible: !needsRetake && e.overall != null });
});

// Certificates (issued only if the backend confirms the criteria)
r.post('/enrollments/:id/certificate', async (req, res) => {
  const e = await mine(req); if (!e || e.overall == null) return res.status(403).json({ error: 'Complete all rounds first' });
  const s = await getSettings(); if (levelIndex(e.level, s.thresholds) < levelIndex(s.minCertLevel, s.thresholds)) return res.status(403).json({ error: `Reach "${s.minCertLevel}" to earn a certificate` });
  let c = await Certificate.findOne({ enrollment: e._id });
  if (!c) { c = await Certificate.create({ certId: 'SB-' + crypto.randomBytes(5).toString('hex').toUpperCase(), student: req.user._id, drive: e.drive._id, enrollment: e._id, score: e.overall, level: e.level });
    await notify(req.user, 'Certificate issued', `Your certificate ID is ${c.certId}.`); }
  res.status(201).json(c);
});
r.get('/certificates', async (req, res) => res.json(await Certificate.find({ student: req.user._id }).populate('drive', 'title').sort('-createdAt')));
r.get('/certificates/:certId', async (req, res) => { const c = await Certificate.findOne({ certId: req.params.certId, student: req.user._id }).populate('drive', 'title').populate('student', 'name'); c ? res.json(c) : res.status(404).json({ error: 'Not found' }); });
r.get('/payments', async (req, res) => res.json(await Payment.find({ user: req.user._id }).sort('-createdAt')));
export default r;
