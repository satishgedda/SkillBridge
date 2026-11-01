import { Router } from 'express';
import { Drive, Certificate, User, Slot } from '../models.js';
const r = Router();
r.get('/drives', async (req, res) => res.json(await Drive.find({ published: true }).sort('-createdAt')));
r.get('/verify/:id', async (req, res) => {
  const c = await Certificate.findOne({ certId: req.params.id }).populate('student', 'name').populate('drive', 'title');
  if (!c) return res.status(404).json({ error: 'No certificate found with this ID' });
  res.json({ certId: c.certId, status: c.status, student: c.student.name, drive: c.drive.title, score: c.score, level: c.level, issued: c.createdAt,
    title: `SkillBridge Placement Readiness Certification — ${c.drive.title}`,
    disclaimer: 'This certification represents SkillBridge\'s own assessment and is not certification by Google, Microsoft, Amazon or any employer.' });
});
r.get('/mentors', async (req, res) => {
  const ms = await User.find({ role: 'mentor', 'mentor.status': 'approved' }).select('name mentor isSample');
  const now = new Date(); const out = [];
  for (const m of ms) out.push({ ...m.toObject(), slots: await Slot.find({ mentor: m._id, booked: false, start: { $gt: now } }).sort('start').limit(20) });
  res.json(out);
});
export default r;
