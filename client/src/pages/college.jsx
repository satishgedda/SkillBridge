import { useState } from 'react';
import { api, errMsg } from '../api';
import { Badge, Bar, Btn, Card, Empty, Err, Field, Loading, Stat, Title, useLoad } from '../ui';
export function Overview() {
  const [d, , e] = useLoad('/college/dashboard');
  return <><Title sub="Real data from your enrolled students">College dashboard {d?.college?.isSample && <Badge tone="gray">Demo data</Badge>}</Title><Loading data={d} error={e}>{d?.pending
    ? <Card className="bg-amber-50">Your college is awaiting admin approval. Dashboard features will be available once the application is approved.</Card>
    : d && <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
    <Stat label="Student strength" value={d.total} /><Stat label="Registered" value={d.registered} /><Stat label="Assessed" value={d.assessed} /><Stat label="Interviews completed" value={d.interviewsCompleted} /><Stat label="Placement-ready (70+)" value={d.ready} /><Stat label="Need improvement" value={d.needImprovement} /></div>}</Loading></>;
}
export function Students() {
  const [ss, load, e] = useLoad('/college/students'); const [drives] = useLoad('/public/drives'); const [sel, setSel] = useState([]); const [drive, setDrive] = useState(''); const [csv, setCsv] = useState(''); const [out, setOut] = useState(null); const [one, setOne] = useState({}); const [err, setErr] = useState('');
  const run = async (fn) => { try { setErr(''); await fn(); load(); } catch (x) { setErr(errMsg(x)); } };
  return <><Title sub="Add students, then assign a placement drive">Students</Title><Err msg={err || (e && e)} />
    <div className="mb-6 grid gap-4 md:grid-cols-2"><Card><h3 className="mb-2 font-bold">Add one student</h3><div className="space-y-2"><Field label="Name" onChange={(x) => setOne({ ...one, name: x.target.value })} /><Field label="Email" onChange={(x) => setOne({ ...one, email: x.target.value })} /><Field label="Branch" onChange={(x) => setOne({ ...one, branch: x.target.value })} />
      <Btn onClick={() => run(async () => setOut([(await api.post('/college/students', one)).data]))}>Add student</Btn></div></Card>
      <Card><h3 className="mb-2 font-bold">Upload CSV</h3><p className="mb-2 text-xs text-mute">Columns: name,email,branch,degree,gradYear (no header). <input type="file" accept=".csv,text/csv" onChange={async (x) => setCsv(await x.target.files[0]?.text())} /></p>
        <Field as="textarea" label="Or paste rows" value={csv} onChange={(x) => setCsv(x.target.value)} /><Btn className="mt-2" onClick={() => run(async () => setOut((await api.post('/college/students/csv', { csv })).data))}>Import</Btn></Card></div>
    {out && <Card className="mb-4 bg-amber-50"><b>Temporary passwords (shown once — share securely):</b>{out.map((o) => <p key={o.email} className="text-sm">{o.email}: {o.tempPassword || o.error}</p>)}</Card>}
    <Card className="mb-4 flex flex-wrap items-center gap-3"><select className="rounded-lg border px-3 py-2" value={drive} onChange={(x) => setDrive(x.target.value)}><option value="">Choose a drive…</option>{drives?.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select>
      <Btn disabled={!drive || !sel.length} onClick={() => run(async () => { await api.post('/college/assign', { driveId: drive, studentIds: sel }); setSel([]); })}>Assign to {sel.length} selected</Btn></Card>
    <Loading data={ss} error="">{ss?.length ? ss.map((s) => <Card key={s._id} className="mb-2 flex items-center gap-3"><input type="checkbox" aria-label={`Select ${s.name}`} checked={sel.includes(s._id)} onChange={() => setSel(sel.includes(s._id) ? sel.filter((x) => x !== s._id) : [...sel, s._id])} />
      <div className="flex-1"><b>{s.name}</b> <span className="text-sm text-mute">{s.email} · {s.profile?.branch || '—'}</span></div><span className="text-sm">{s.enrollments.map((x) => `${x.drive}: ${x.overall ?? 'in progress'}`).join('; ')}</span></Card>) : <Empty>No students yet.</Empty>}</Loading></>;
}
export function Analytics() {
  const [a, , e] = useLoad('/college/analytics');
  return <><Title>Analytics</Title><Loading data={a} error={e}>{a?.departments.length ? <Card><h3 className="mb-3 font-bold">Average readiness by department</h3>{a.departments.map((d) => <Bar key={d.branch} label={`${d.branch} (${d.students} students)`} value={d.average} />)}<Btn variant="outline" onClick={() => window.print()}>Download report (PDF)</Btn></Card> : <Empty>No completed assessments yet. Analytics appear once students finish drives.</Empty>}</Loading></>;
}
