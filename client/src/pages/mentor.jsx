import { useState } from 'react';
import { api, errMsg, fmt } from '../api';
import { useAuth } from '../auth';
import { Badge, Btn, Card, Empty, Err, Field, Loading, Stat, Title, tone, useLoad } from '../ui';
const CATS = { technical: ['dsa', 'programming', 'csFundamentals', 'projects', 'problemSolving'], hr: ['communication', 'behavioral', 'confidence', 'teamwork', 'professionalism'] };
export function Overview() {
  const { user } = useAuth();
  const [d, , e] = useLoad('/mentor/summary');
  return <><Title sub="Your mentor dashboard">Dashboard {user.isSample && <Badge tone="gray">Demo data</Badge>}</Title><Loading data={d} error={e}>{d && d.status !== 'approved' && <Card className="mb-4 bg-amber-50">Verification status: <Badge tone={tone(d.status)}>{d.status}</Badge> You can conduct paid interviews once an admin approves your profile.</Card>}
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4"><Stat label="Upcoming" value={d?.upcoming} /><Stat label="Completed" value={d?.completed} /><Stat label="Open slots" value={d?.slots} /><Stat label="Earnings (₹)" value={d?.earnings} /></div></Loading></>;
}
export function Profile() {
  const { user, setUser } = useAuth(); const [f, setF] = useState({ name: user.name, phone: user.phone || '', ...user.mentor }); const [m, setM] = useState('');
  const F = [['name', 'Full name'], ['phone', 'Phone'], ['company', 'Current company'], ['title', 'Job title'], ['years', 'Years of experience'], ['specialization', 'Specialization'], ['expertise', 'Interview expertise'], ['linkedin', 'LinkedIn'], ['photo', 'Profile photo URL'], ['rate', 'Fee per interview (₹, 0 = free)']];
  return <><Title>Profile</Title><Card><form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); try { const { name, phone, ...mentor } = f; delete mentor.status; setUser((await api.put('/auth/me', { name, phone, mentor })).data); setM('Saved'); } catch (x) { setM(errMsg(x)); } }}>
    {F.map(([k, l]) => <Field key={k} label={l} value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />)}<div className="md:col-span-2"><Btn>Save changes</Btn> <span className="ml-3 text-sm">{m}</span></div></form></Card></>;
}
export function Slots() {
  const [s, load, e] = useLoad('/mentor/slots'); const [f, setF] = useState({ start: '', minutes: 45 }); const [err, setErr] = useState('');
  return <><Title sub="Pick times in your local time zone">Availability</Title><Card className="mb-4"><form className="flex flex-wrap items-end gap-3" onSubmit={async (ev) => { ev.preventDefault(); try { setErr(''); await api.post('/mentor/slots', { start: new Date(f.start).toISOString(), minutes: f.minutes }); load(); } catch (x) { setErr(errMsg(x)); } }}>
    <Field label="Start" type="datetime-local" required value={f.start} onChange={(ev) => setF({ ...f, start: ev.target.value })} /><Field label="Minutes" type="number" value={f.minutes} onChange={(ev) => setF({ ...f, minutes: ev.target.value })} /><Btn>Add slot</Btn></form></Card>
    <Err msg={err} /><Loading data={s} error={e}>{s?.length ? s.map((x) => <Card key={x._id} className="mb-2 flex items-center justify-between"><span>{fmt(x.start)} <Badge tone={x.booked ? 'amber' : 'green'}>{x.booked ? 'booked' : 'open'}</Badge></span>
      {!x.booked && <Btn variant="outline" onClick={async () => { try { setErr(''); await api.delete(`/mentor/slots/${x._id}`); load(); } catch (error) { setErr(errMsg(error)); } }}>Delete</Btn>}</Card>) : <Empty>No upcoming slots.</Empty>}</Loading></>;
}
function Evaluate({ b, done }) {
  const type = b.enrollment.drive.rounds.find((r) => r.order === b.order)?.interviewType || 'technical'; const [sc, setSc] = useState({}); const [t, setT] = useState({}); const [err, setErr] = useState('');
  return <form className="mt-4 space-y-3 border-t pt-4" onSubmit={async (e) => { e.preventDefault(); try { await api.post(`/mentor/bookings/${b._id}/evaluate`, { scores: sc, ...t }); done(); } catch (x) { setErr(errMsg(x)); } }}>
    <h4 className="font-bold">{type} scorecard (0–10 per category)</h4><div className="grid gap-3 sm:grid-cols-3">{CATS[type].map((c) => <Field key={c} label={c} type="number" min="0" max="10" step="0.5" required onChange={(e) => setSc({ ...sc, [c]: +e.target.value })} />)}</div>
    {['feedback', 'strengths', 'weaknesses', 'recommendations'].map((k) => <Field key={k} as="textarea" label={k[0].toUpperCase() + k.slice(1)} required onChange={(e) => setT({ ...t, [k]: e.target.value })} />)}<Err msg={err} /><Btn>Submit scorecard</Btn></form>;
}
export function Bookings() {
  const [bs, load, e] = useLoad('/mentor/bookings'); const [open, setOpen] = useState(null); const [err, setErr] = useState('');
  const act = async (id, action) => { try { await api.patch(`/mentor/bookings/${id}`, { action }); load(); } catch (x) { setErr(errMsg(x)); } };
  return <><Title>Interviews</Title><Err msg={err} /><Loading data={bs} error={e}>{bs?.length ? bs.map((b) => <Card key={b._id} className="mb-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{b.student?.name}</b> <Badge tone={tone(b.status)}>{b.status}</Badge>
    <p className="text-sm text-mute">{b.slot && fmt(b.slot.start)} · {b.enrollment?.drive?.title} · {b.student?.profile?.branch} · target: {b.student?.profile?.targetRole || '—'}</p></div>
    <div className="flex gap-2">{b.status === 'requested' && <><Btn onClick={() => act(b._id, 'accept')}>Accept</Btn><Btn variant="outline" onClick={() => act(b._id, 'reject')}>Reject</Btn></>}
      {b.status === 'accepted' && <><a href={b.meetingUrl} target="_blank" rel="noreferrer"><Btn variant="outline">Join</Btn></a><Btn onClick={() => setOpen(open === b._id ? null : b._id)}>Evaluate</Btn></>}</div></div>
    {open === b._id && <Evaluate b={b} done={() => { setOpen(null); load(); }} />}</Card>) : <Empty>No bookings yet.</Empty>}</Loading></>;
}
