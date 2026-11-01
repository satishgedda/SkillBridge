import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from './api';
export const cx = (...c) => c.filter(Boolean).join(' ');
export const Btn = ({ variant = 'primary', className, ...p }) => <button {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
  variant === 'primary' && 'bg-brand text-white hover:bg-blue-700', variant === 'outline' && 'border border-slate-300 bg-white hover:bg-slate-50', variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700', variant === 'ghost' && 'hover:bg-slate-100', className)} />;
export const Card = ({ className, children }) => <div className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</div>;
export const Field = ({ label, as, ...p }) => <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span>
  {as === 'textarea' ? <textarea rows={3} {...p} className="w-full rounded-lg border border-slate-300 px-3 py-2" /> : <input {...p} className="w-full rounded-lg border border-slate-300 px-3 py-2" />}</label>;
export const Bar = ({ label, value, max = 100 }) => <div className="mb-3"><div className="flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{Math.round(value)}%</span></div>
  <div className="h-2.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min((value / max) * 100, 100)}%` }} /></div></div>;
export const Stat = ({ label, value }) => <Card><div className="text-sm text-mute">{label}</div><div className="font-display text-3xl font-bold text-navy">{value ?? '—'}</div></Card>;
export const Err = ({ msg }) => msg ? <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div> : null;
export const Empty = ({ children }) => <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-mute">{children}</div>;
export const Badge = ({ children, tone = 'blue' }) => <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', gray: 'bg-slate-100 text-slate-700', amber: 'bg-amber-100 text-amber-800' }[tone])}>{children}</span>;
export const tone = (s) => ({ passed: 'green', approved: 'green', completed: 'green', valid: 'green', captured: 'green', failed: 'red', rejected: 'red', cancelled: 'red', revoked: 'red', locked: 'gray', pending: 'amber', requested: 'amber', awaiting_payment: 'amber' }[s] || 'blue');
export function useLoad(url) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const load = useCallback(() => api.get(url).then((r) => { setData(r.data); setError(''); }).catch((e) => setError(errMsg(e))), [url]);
  useEffect(() => { setData(null); load(); }, [load]);
  return [data, load, error];
}
export const Loading = ({ data, error, children }) => error ? <Err msg={error} /> : data == null ? <p className="text-mute">Loading…</p> : children;
export const Title = ({ children, sub }) => <div className="mb-6"><h1 className="text-2xl font-bold text-navy">{children}</h1>{sub && <p className="text-mute">{sub}</p>}</div>;
export async function pay(type, refId) { // creates order, opens Razorpay (or completes DEV payment), verifies on the server
  const o = (await api.post('/payments/order', { type, refId })).data;
  if (o.dev) return (await api.post('/payments/verify', { paymentId: o.paymentId })).data;
  await new Promise((ok, no) => { if (window.Razorpay) return ok(); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = ok; s.onerror = () => no(new Error('Could not load Razorpay')); document.body.appendChild(s); });
  return new Promise((ok, no) => new window.Razorpay({ key: o.keyId, order_id: o.orderId, amount: o.amount * 100, currency: 'INR', name: 'SkillBridge',
    handler: (r) => api.post('/payments/verify', { paymentId: o.paymentId, ...r }).then((x) => ok(x.data)).catch(no), modal: { ondismiss: () => no(new Error('Payment cancelled')) } }).open());
}
