import { Notification, Setting, Audit, Enrollment } from './models.js';
import { DEFAULTS, levelFor } from './scoring.js';

export const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined && o[k] !== '').map((k) => [k, o[k]]));
export const safe = (u) => { const o = u.toObject ? u.toObject() : { ...u }; delete o.password; return o; };
export async function getSettings() { const s = await Setting.findOne({ key: 'readiness' }); return { ...DEFAULTS, ...(s?.value || {}) }; }
export const audit = (actor, action, target, meta) => Audit.create({ actor: actor._id, action, target, meta });

export async function notify(user, title, body) {
  await Notification.create({ user: user._id, title, body });
  if (!process.env.SMTP_HOST) return console.log(`[mail:dev] to=${user.email} | ${title} | ${body}`);
  try {
    const { default: nm } = await import('nodemailer'); // npm i nodemailer to enable real email
    await nm.createTransport({ host: process.env.SMTP_HOST, port: 587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
      .sendMail({ from: process.env.MAIL_FROM, to: user.email, subject: title, text: body });
  } catch (e) { console.error('mail failed', e.message); }
}

export async function enroll(studentId, drive) {
  const rounds = [...drive.rounds].sort((a, b) => a.order - b.order).map((r, i) => ({ order: r.order, status: i === 0 ? 'open' : 'locked', attempts: 0 }));
  try { return await Enrollment.create({ student: studentId, drive: drive._id, rounds }); }
  catch (e) { if (e.code === 11000) return Enrollment.findOne({ student: studentId, drive: drive._id }); throw e; }
}

// Records a round score, enforces sequence, unlocks the next round and computes overall readiness when all rounds pass.
export async function recordRound(enr, drive, order, score) {
  const rs = [...enr.rounds].sort((a, b) => a.order - b.order);
  const i = rs.findIndex((r) => r.order === order); const r = rs[i];
  const def = drive.rounds.find((d) => d.order === order);
  r.score = Math.round(score * 10) / 10; r.attempts += 1; r.status = r.score >= def.passingScore ? 'passed' : 'failed';
  if (r.status === 'passed' && rs[i + 1]?.status === 'locked') rs[i + 1].status = 'open';
  if (rs.every((x) => x.status === 'passed')) {
    enr.overall = Math.round((rs.reduce((s, x) => s + x.score, 0) / rs.length) * 10) / 10;
    enr.level = levelFor(enr.overall, (await getSettings()).thresholds); enr.completedAt = new Date();
  }
  enr.markModified('rounds'); return enr.save();
}
export const canTake = (enr, order) => { const r = enr.rounds.find((x) => x.order === order); return r && (r.status === 'open' || r.status === 'failed'); };
