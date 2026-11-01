import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, Enrollment, Drive, Booking } from '../models.js';
import { guard } from '../middleware.js';
import { enroll } from '../lib.js';
const r = Router(); r.use(guard('college'));
r.use(async (req, res, next) => {
  await req.user.populate('college');
  if (!req.user.college) return res.status(409).json({ error: 'Your account is missing its college profile. Contact SkillBridge support.' });
  if (req.user.college.status !== 'approved' && req.path !== '/dashboard') return res.status(403).json({ error: 'Your college is awaiting admin approval', pending: true });
  next();
});
const students = (req) => User.find({ role: 'student', college: req.user.college._id });

r.get('/dashboard', async (req, res) => {
  if (req.user.college.status !== 'approved') return res.json({ college: req.user.college, pending: true });
  const ss = await students(req); const ids = ss.map((s) => s._id); const enrs = await Enrollment.find({ student: { $in: ids } }).populate('drive', 'minLevel');
  const done = enrs.filter((e) => e.overall != null);
  res.json({ college: req.user.college, total: req.user.college.strength || 0, registered: ss.length, assessed: new Set(enrs.filter((e) => e.rounds.some((x) => x.score != null)).map((e) => String(e.student))).size,
    interviewsCompleted: await Booking.countDocuments({ student: { $in: ids }, status: 'completed' }), ready: done.filter((e) => e.overall >= 70).length, needImprovement: done.filter((e) => e.overall < 70).length });
});
r.get('/students', async (req, res) => {
  const ss = await students(req).select('name email profile'); const enrs = await Enrollment.find({ student: { $in: ss.map((s) => s._id) } }).populate('drive', 'title');
  res.json(ss.map((s) => ({ ...s.toObject(), enrollments: enrs.filter((e) => e.student.equals(s._id)).map((e) => ({ drive: e.drive.title, overall: e.overall, level: e.level })) })));
});
async function addStudent(req, row) {
  if (await User.exists({ email: row.email.toLowerCase() })) return { email: row.email, error: 'exists' };
  const pw = crypto.randomBytes(5).toString('hex');
  await User.create({ name: row.name, email: row.email, password: await bcrypt.hash(pw, 10), role: 'student', college: req.user.college._id,
    profile: { college: req.user.college.name, branch: row.branch, degree: row.degree || 'B.Tech', gradYear: +row.gradYear || undefined } });
  return { email: row.email, tempPassword: pw }; // shown once; students should change it
}
r.post('/students', async (req, res) => res.status(201).json(await addStudent(req, req.body)));
r.post('/students/csv', async (req, res) => { // csv text: name,email,branch,degree,gradYear
  const rows = String(req.body.csv || '').split(/\r?\n/).map((l) => l.split(',').map((s) => s.trim())).filter((c) => c[0] && c[1]?.includes('@'));
  const out = []; for (const [name, email, branch, degree, gradYear] of rows.slice(0, 500)) out.push(await addStudent(req, { name, email, branch, degree, gradYear }));
  res.json(out);
});
r.post('/assign', async (req, res) => {
  const d = await Drive.findOne({ _id: req.body.driveId, published: true }); if (!d) return res.status(404).json({ error: 'Drive not found' });
  const ss = await User.find({ _id: { $in: req.body.studentIds }, role: 'student', college: req.user.college._id }); // only own students
  for (const s of ss) await enroll(s._id, d); res.json({ assigned: ss.length });
});
r.get('/analytics', async (req, res) => {
  const ss = await students(req); const enrs = await Enrollment.find({ student: { $in: ss.map((s) => s._id) }, overall: { $ne: null } });
  const by = {}; for (const e of enrs) { const br = ss.find((s) => s._id.equals(e.student))?.profile?.branch || 'Unspecified'; (by[br] ??= []).push(e.overall); }
  res.json({ departments: Object.entries(by).map(([branch, v]) => ({ branch, students: v.length, average: Math.round(v.reduce((a, b) => a + b, 0) / v.length) })) });
});
export default r;
