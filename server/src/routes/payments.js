import { Router } from 'express';
import crypto from 'crypto';
import { Payment, Drive, Booking, User } from '../models.js';
import { guard } from '../middleware.js';
import { enroll, notify } from '../lib.js';
const r = Router(); const K = () => [process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET];
const eq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Idempotent: the atomic status flip guarantees fulfilment happens once even if verify + webhook both arrive.
async function capture(id, rzpPaymentId) {
  const p = await Payment.findOneAndUpdate({ _id: id, status: { $ne: 'captured' } }, { status: 'captured', razorpayPaymentId: rzpPaymentId }, { new: true }); if (!p) return null;
  const u = await User.findById(p.user);
  if (p.type === 'drive') await enroll(p.user, await Drive.findById(p.refId));
  if (p.type === 'booking') { const b = await Booking.findByIdAndUpdate(p.refId, { status: 'requested' }); await notify(await User.findById(b.mentor), 'New interview request', `${u.name} booked a paid interview.`); }
  await notify(u, 'Payment confirmed', `We received ₹${p.amount}.`); return p;
}
r.post('/order', guard('student'), async (req, res) => {
  const { type, refId } = req.body; let amount;
  if (type === 'drive') amount = (await Drive.findOne({ _id: refId, published: true }))?.price;
  else if (type === 'booking') { const b = await Booking.findOne({ _id: refId, student: req.user._id, status: 'awaiting_payment' }); amount = b?.price; }
  if (!amount) return res.status(400).json({ error: 'Nothing to pay for' });
  const p = await Payment.create({ user: req.user._id, type, refId, amount, dev: !K()[0] });
  if (p.dev) { if (process.env.NODE_ENV === 'production' || process.env.DEV_PAYMENTS !== 'true') { await p.deleteOne(); return res.status(503).json({ error: 'Payments are not configured' }); } return res.json({ dev: true, paymentId: p._id, amount }); }
  const rz = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(K().join(':')).toString('base64') },
    body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: String(p._id) }) }).then((x) => x.json());
  if (!rz.id) return res.status(502).json({ error: 'Could not create payment order' });
  p.orderId = rz.id; await p.save(); res.json({ dev: false, paymentId: p._id, orderId: rz.id, amount, keyId: K()[0] });
});
r.post('/verify', guard('student'), async (req, res) => {
  const p = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id }); if (!p) return res.status(404).json({ error: 'Payment not found' });
  if (p.status === 'captured') return res.json({ status: 'captured' });
  if (p.dev) { if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed' }); await capture(p._id, 'dev'); return res.json({ status: 'captured', dev: true }); }
  const sig = crypto.createHmac('sha256', K()[1]).update(`${p.orderId}|${req.body.razorpay_payment_id}`).digest('hex'); // never trust the browser's "success"
  if (!eq(sig, String(req.body.razorpay_signature || ''))) { await Payment.updateOne({ _id: p._id }, { status: 'failed' }); return res.status(400).json({ error: 'Payment verification failed' }); }
  await capture(p._id, req.body.razorpay_payment_id); res.json({ status: 'captured' });
});
export async function webhook(req, res) {
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'x').update(req.body).digest('hex');
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !eq(sig, String(req.headers['x-razorpay-signature'] || ''))) return res.status(400).end();
  const ev = JSON.parse(req.body); const ent = ev.payload?.payment?.entity;
  if (ev.event === 'payment.captured' && ent) { const p = await Payment.findOne({ orderId: ent.order_id }); if (p) await capture(p._id, ent.id); }
  if (ev.event === 'refund.processed' && ev.payload?.refund?.entity) await Payment.updateOne({ razorpayPaymentId: ev.payload.refund.entity.payment_id }, { status: 'refunded' });
  res.json({ ok: true });
}
export default r;
