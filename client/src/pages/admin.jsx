import { useState } from 'react';
import { api, errMsg, fmt } from '../api';
import { Badge, Btn, Card, Empty, Err, Field, Loading, Stat, Title, tone, useLoad } from '../ui';
export function Overview() {
  const [s, , e] = useLoad('/admin/stats');
  return <><Title>Platform overview</Title><Loading data={s} error={e}><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">{[['Users', s?.users], ['Students', s?.students], ['Mentors', s?.mentors], ['Colleges', s?.colleges], ['Drives', s?.drives], ['Interviews done', s?.interviews], ['Revenue (₹)', s?.revenue], ['Pending verifications', s?.pending]].map(([l, v]) => <Stat key={l} label={l} value={v} />)}</div></Loading></>;
}
export function Users() {
  const [role, setRole] = useState(''); const [page, setPage] = useState(1); const [d, , e] = useLoad(`/admin/users?page=${page}&limit=20${role ? `&role=${role}` : ''}`);
  return <><Title>Users</Title><div className="mb-4 flex gap-2">{['', 'student', 'mentor', 'college'].map((r) => <Btn key={r} variant={role === r ? 'primary' : 'outline'} onClick={() => { setRole(r); setPage(1); }}>{r || 'all'}</Btn>)}</div>
    <Loading data={d} error={e}>{d?.items.map((u) => <Card key={u._id} className="mb-2 flex justify-between"><span><b>{u.name}</b> <span className="text-sm text-mute">{u.email}</span>{u.isSample && <Badge tone="gray">sample</Badge>}</span><Badge>{u.role}</Badge></Card>)}
      <div className="mt-3 flex items-center gap-3"><Btn variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Btn><span className="text-sm">Page {page} of {Math.max(1, Math.ceil((d?.total || 0) / 20))}</span><Btn variant="outline" disabled={page * 20 >= (d?.total || 0)} onClick={() => setPage(page + 1)}>Next</Btn></div></Loading></>;
}
export function Mentors() {
  const [d, load, e] = useLoad('/admin/users?role=mentor&limit=100'); const [err, setErr] = useState('');
  const set = async (id, status) => { try { setErr(''); await api.patch(`/admin/mentors/${id}`, { status }); load(); } catch (x) { setErr(errMsg(x)); } };
  return <><Title sub="Verify credentials (e.g. via LinkedIn / company email) before approving">Mentor verification</Title><Err msg={err} /><Loading data={d} error={e}>{d?.items.length ? d.items.map((u) => <Card key={u._id} className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><b>{u.name}</b> <Badge tone={tone(u.mentor.status)}>{u.mentor.status}</Badge>
    {u.isSample && <Badge tone="gray">Demo profile</Badge>}
    <p className="text-sm text-mute">{u.email} · {u.mentor.title} at {u.mentor.company} · {u.mentor.years} yrs · {u.mentor.linkedin || 'no LinkedIn given'}</p></div>
    <div className="flex gap-2"><Btn onClick={() => set(u._id, 'approved')}>Approve</Btn><Btn variant="danger" onClick={() => set(u._id, 'rejected')}>Reject</Btn></div></Card>) : <Empty>No mentor applications.</Empty>}</Loading></>;
}
export function Colleges() {
  const [d, load, e] = useLoad('/admin/colleges'); const [err, setErr] = useState('');
  const set = async (id, status) => { try { setErr(''); await api.patch(`/admin/colleges/${id}`, { status, subscription: { plan: 'annual', validTill: new Date(Date.now() + 365 * 864e5) } }); load(); } catch (x) { setErr(errMsg(x)); } };
  return <><Title>Colleges</Title><Err msg={err} /><Loading data={d} error={e}>{d?.length ? d.map((c) => <Card key={c._id} className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><b>{c.name}</b> <Badge tone={tone(c.status)}>{c.status}</Badge><p className="text-sm text-mute">{c.university} · {c.email} · strength {c.strength}</p></div>
    {c.isSample && <Badge tone="gray">Demo profile</Badge>}
    <div className="flex gap-2"><Btn onClick={() => set(c._id, 'approved')}>Approve (1-yr plan)</Btn><Btn variant="danger" onClick={() => set(c._id, 'rejected')}>Reject</Btn></div></Card>) : <Empty>No college applications.</Empty>}</Loading></>;
}
const TEMPLATE = JSON.stringify([{ order: 1, name: 'Aptitude', kind: 'mcq', topics: ['Aptitude'], questionCount: 10, duration: 20, passingScore: 40, description: '', instructions: '', criteria: '' }, { order: 2, name: 'Technical Interview', kind: 'interview', interviewType: 'technical', duration: 45, passingScore: 40, description: '', instructions: '', criteria: '' }], null, 1);
export function Drives() {
  const [ds, load, e] = useLoad('/admin/drives'); const [f, setF] = useState({ title: '', description: '', eligibility: '', price: 0, rounds: TEMPLATE }); const [err, setErr] = useState('');
  return <><Title sub="Create drives, then publish them for students">Placement drives</Title><Card className="mb-6"><form className="grid gap-3" onSubmit={async (ev) => { ev.preventDefault(); try { setErr(''); await api.post('/admin/drives', { ...f, rounds: JSON.parse(f.rounds) }); load(); } catch (x) { setErr(errMsg(x)); } }}>
    <Field label="Title" required onChange={(x) => setF({ ...f, title: x.target.value })} /><Field label="Description" onChange={(x) => setF({ ...f, description: x.target.value })} /><Field label="Eligibility" onChange={(x) => setF({ ...f, eligibility: x.target.value })} /><Field label="Price (₹)" type="number" value={f.price} onChange={(x) => setF({ ...f, price: +x.target.value })} />
    <Field as="textarea" rows={10} label="Rounds (JSON: order, name, kind mcq|interview, topics, questionCount, duration, passingScore, interviewType technical|hr, instructions, criteria)" value={f.rounds} onChange={(x) => setF({ ...f, rounds: x.target.value })} /><Err msg={err} /><Btn>Create drive</Btn></form></Card>
    <Loading data={ds} error={e}>{ds?.map((d) => <Card key={d._id} className="mb-2 flex flex-wrap items-center justify-between gap-2"><span><b>{d.title}</b> · {d.rounds.length} rounds · ₹{d.price} <Badge tone={d.published ? 'green' : 'gray'}>{d.published ? 'published' : 'draft'}</Badge></span>
      <span className="flex gap-2"><Btn variant="outline" onClick={async () => { try { setErr(''); await api.put(`/admin/drives/${d._id}`, { published: !d.published }); load(); } catch (x) { setErr(errMsg(x)); } }}>{d.published ? 'Unpublish' : 'Publish'}</Btn><Btn variant="danger" onClick={async () => { if (confirm('Delete this drive?')) { try { setErr(''); await api.delete(`/admin/drives/${d._id}`); load(); } catch (x) { setErr(errMsg(x)); } } }}>Delete</Btn></span></Card>)}</Loading></>;
}
export function Questions() {
  const [d, load, e] = useLoad('/admin/questions?limit=50'); const [f, setF] = useState({ topic: '', text: '', options: '', correct: '' }); const [err, setErr] = useState('');
  return <><Title sub="MCQ question bank (coding assessments need a sandbox provider — see README)">Assessments</Title><Card className="mb-6"><form className="grid gap-3" onSubmit={async (ev) => { ev.preventDefault(); try { setErr(''); await api.post('/admin/questions', { topic: f.topic, text: f.text, options: f.options.split('\n').filter(Boolean), correct: f.correct.split(',').map((x) => +x.trim() - 1) }); load(); } catch (x) { setErr(errMsg(x)); } }}>
    <Field label="Topic (e.g. DSA, SQL, Aptitude)" required onChange={(x) => setF({ ...f, topic: x.target.value })} /><Field as="textarea" label="Question" required onChange={(x) => setF({ ...f, text: x.target.value })} /><Field as="textarea" label="Options (one per line)" required onChange={(x) => setF({ ...f, options: x.target.value })} />
    <Field label="Correct option number(s), comma separated (e.g. 2 or 1,3)" required onChange={(x) => setF({ ...f, correct: x.target.value })} /><Err msg={err} /><Btn>Add question</Btn></form></Card>
    <Loading data={d} error={e}>{d?.items.map((q) => <Card key={q._id} className="mb-2 flex justify-between gap-3"><span><Badge>{q.topic}</Badge> {q.text}{q.isSample && <Badge tone="gray">sample</Badge>}</span><Btn variant="outline" onClick={async () => { try { setErr(''); await api.delete(`/admin/questions/${q._id}`); load(); } catch (x) { setErr(errMsg(x)); } }}>Delete</Btn></Card>)}</Loading></>;
}
export function Records() {
  const [tab, setTab] = useState('bookings'); const [d, load, e] = useLoad(`/admin/${tab}`); const [err, setErr] = useState('');
  return <><Title>Interviews, payments, certificates</Title><Err msg={err} /><div className="mb-4 flex gap-2">{['bookings', 'payments', 'certificates', 'audit'].map((t) => <Btn key={t} variant={tab === t ? 'primary' : 'outline'} onClick={() => { setTab(t); setErr(''); }}>{t}</Btn>)}</div>
    <Loading data={d} error={e}>{d?.length ? d.map((r) => <Card key={r._id} className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm">
      {tab === 'bookings' && `${r.student?.name} → ${r.mentor?.name} · ${r.slot ? fmt(r.slot.start) : ''}`}{tab === 'payments' && `${r.user?.name} · ${r.type} · ₹${r.amount}${r.dev ? ' (dev)' : ''}`}{tab === 'certificates' && `${r.certId} · ${r.student?.name} · ${r.drive?.title}`}{tab === 'audit' && `${r.actor?.name} · ${r.action} · ${r.target} · ${fmt(r.createdAt)}`}</span>
      {tab !== 'audit' && <span className="flex items-center gap-2"><Badge tone={tone(r.status)}>{r.status}</Badge>
        {tab === 'payments' && r.status === 'captured' && <Btn variant="outline" onClick={async () => { try { setErr(''); await api.patch(`/admin/payments/${r._id}/refund`); load(); } catch (x) { setErr(errMsg(x)); } }}>Mark refunded</Btn>}
        {tab === 'certificates' && <Btn variant="outline" onClick={async () => { try { setErr(''); await api.patch(`/admin/certificates/${r._id}`, { status: r.status === 'valid' ? 'revoked' : 'valid' }); load(); } catch (x) { setErr(errMsg(x)); } }}>{r.status === 'valid' ? 'Revoke' : 'Restore'}</Btn>}</span>}</Card>) : <Empty>Nothing here yet.</Empty>}</Loading></>;
}
export function Settings() {
  const [s, , e] = useLoad('/admin/settings'); const [txt, setTxt] = useState(null); const [m, setM] = useState('');
  const val = txt ?? (s ? JSON.stringify(s, null, 1) : '');
  return <><Title sub="Readiness level thresholds (score 0–100), minimum level for certification, and mentor payout share">Settings</Title><Loading data={s} error={e}><Card><Field as="textarea" rows={18} label="Readiness settings (JSON)" value={val} onChange={(x) => setTxt(x.target.value)} />
    <Btn className="mt-3" onClick={async () => { try { await api.put('/admin/settings', JSON.parse(val)); setM('Saved'); } catch (x) { setM(errMsg(x)); } }}>Save settings</Btn> <span className="ml-3 text-sm">{m}</span></Card></Loading></>;
}
