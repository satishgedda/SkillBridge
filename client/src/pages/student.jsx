import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Star, Clock, MapPin, Briefcase, ChevronDown, ChevronUp, CheckCircle, XCircle, BookOpen, Award, TrendingUp, Users, Calendar, Target, Zap } from 'lucide-react';
import { api, errMsg, fmt } from '../api';
import { useAuth } from '../auth';
import { Badge, Bar, Btn, Card, Empty, Err, Field, Loading, Stat, Title, pay, tone, useLoad } from '../ui';
import {
  DEMO_MENTORS, DEMO_DRIVES, DEMO_ASSESSMENTS, DEMO_MOCK_INTERVIEWS,
  DEMO_BOOKINGS, DEMO_REPORTS, DEMO_CERTIFICATES, DEMO_SKILL_RECOMMENDATIONS,
} from './demo-data';

// ─── Shared Demo Banner ───────────────────────────────────────────────────────
function DemoBanner({ label = 'Demo Content — Sample Data Only' }) {
  return (
    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {label}
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
      <span className="ml-1 text-xs text-mute">{rating}</span>
    </span>
  );
}

// ─── Skill Progress Bar (inline, no extra component) ─────────────────────────
function SkillBar({ label, value, target, tone: t = 'brand' }) {
  const colors = { brand: 'bg-brand', green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {target && <span className="text-xs text-mute">Target: {target}%</span>}
          <span className="font-bold">{value}%</span>
        </div>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${colors[t] ?? 'bg-brand'}`} style={{ width: `${Math.min(value, 100)}%` }} />
        {target && <div className="absolute top-0 h-full w-0.5 bg-navy/40" style={{ left: `${Math.min(target, 100)}%` }} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW (Student Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export function Overview() {
  const { user } = useAuth();
  const [d, , e] = useLoad('/student/summary');

  return (
    <>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Welcome back, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-mute">Here's your placement readiness snapshot.</p>
        {user.isSample && <Badge tone="gray" className="mt-1">Demo account</Badge>}
      </div>

      <Loading data={d} error={e}>
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Stat label="Profile completion" value={`${d?.completion ?? 0}%`} />
          <Stat label="Readiness score" value={d?.latest ? `${d.latest.overall}/100` : '—'} />
          <Stat label="Drives enrolled" value={d?.enrollments?.length ?? 0} />
          <Stat label="Certificates earned" value={d?.certificates ?? 0} />
        </div>

        {/* Profile completion nudge */}
        {(d?.completion ?? 0) < 80 && (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-soft">
            <div>
              <p className="font-semibold text-navy">Your profile is {d?.completion ?? 0}% complete</p>
              <p className="text-sm text-mute">Complete your profile to unlock better mentor matches and placement opportunities.</p>
            </div>
            <Link to="/app/profile"><Btn>Complete profile</Btn></Link>
          </Card>
        )}

        {/* Real upcoming interviews */}
        {d?.upcoming?.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 text-lg font-bold">Upcoming interviews</h2>
            {d.upcoming.map((b) => (
              <Card key={b._id} className="mb-2">
                {b.slot && fmt(b.slot.start)} with {b.mentor?.name}{' '}
                <Badge tone={tone(b.status)}>{b.status}</Badge>
              </Card>
            ))}
          </>
        )}

        {/* Real active drives */}
        {d?.enrollments?.length > 0 && (
          <>
            <h2 className="mb-2 mt-8 text-lg font-bold">Active drives</h2>
            {d.enrollments.map((x) => (
              <Card key={x._id} className="mb-2 flex items-center justify-between">
                <span>{x.drive.title}</span>
                <Link to={`/app/enrollment/${x._id}`}><Btn>Continue</Btn></Link>
              </Card>
            ))}
          </>
        )}
      </Loading>

      {/* ── Demo: Quick Actions ─────────────────────────────────── */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Browse Drives', icon: Briefcase, to: '/app/drives', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Take Assessments', icon: BookOpen, to: '/app/assessments', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Mock Interviews', icon: Users, to: '/app/mentors', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'My Certificates', icon: Award, to: '/app/certificates', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(({ label, icon: Icon, to, color }) => (
          <Link key={to} to={to}>
            <Card className={`flex cursor-pointer items-center gap-3 border transition hover:shadow-md ${color}`}>
              <Icon size={20} />
              <span className="font-semibold text-sm">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Demo: Recommended Mentors ───────────────────────────── */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recommended Mentors</h2>
          <Link to="/app/mentors" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
        </div>
        <DemoBanner />
        <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {DEMO_MENTORS.slice(0, 3).map((m) => (
            <Card key={m.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${m.avatarColor}`}>{m.avatar}</div>
                <div>
                  <p className="font-bold leading-tight">{m.name}</p>
                  <p className="text-xs text-mute">{m.role}</p>
                </div>
              </div>
              <StarRating rating={m.rating} />
              <p className="text-xs text-mute line-clamp-2">{m.bio}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-semibold text-brand">{m.rate}</span>
                <Link to="/app/mentors"><Btn variant="outline" className="text-xs px-2 py-1">View</Btn></Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Demo: Placement Drives ──────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Open Placement Drives</h2>
          <Link to="/app/drives" className="text-sm font-semibold text-brand hover:underline">Browse all →</Link>
        </div>
        <DemoBanner />
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {DEMO_DRIVES.filter((d) => d.status !== 'Closed').slice(0, 4).map((drive) => (
            <Card key={drive.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{drive.company}</p>
                  <p className="text-sm font-semibold text-brand">{drive.role}</p>
                </div>
                <Badge tone={drive.statusTone}>{drive.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
                <span className="flex items-center gap-1"><MapPin size={11} />{drive.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={11} />{drive.package}</span>
                <span className="flex items-center gap-1"><Clock size={11} />Deadline: {drive.deadline}</span>
              </div>
              <Link to="/app/drives">
                <Btn variant="outline" className="mt-1 w-full text-xs">View drive details</Btn>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Demo: Recommended Assessments ──────────────────────── */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recommended Assessments</h2>
          <Link to="/app/assessments" className="text-sm font-semibold text-brand hover:underline">See all →</Link>
        </div>
        <DemoBanner />
        <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {DEMO_ASSESSMENTS.slice(0, 3).map((a) => (
            <Card key={a.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm leading-snug">{a.title}</p>
                <Badge tone={a.difficultyTone}>{a.difficulty}</Badge>
              </div>
              <p className="text-xs text-mute">{a.questions} questions · {a.duration}</p>
              <Link to="/app/assessments">
                <Btn className="mt-1 w-full text-xs">Attempt now</Btn>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Demo: Skill Improvement ─────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Skill Improvement</h2>
          <Link to="/app/improvement" className="text-sm font-semibold text-brand hover:underline">Full report →</Link>
        </div>
        <DemoBanner label="Demo Progress — Sample Data" />
        <Card className="mt-3">
          {DEMO_SKILL_RECOMMENDATIONS.slice(0, 4).map((s) => (
            <SkillBar key={s.skill} label={s.skill} value={s.current} target={s.target}
              tone={s.current >= s.target ? 'green' : s.current >= 70 ? 'brand' : s.current >= 55 ? 'amber' : 'red'} />
          ))}
        </Card>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export function Profile() {
  const { user, setUser } = useAuth();
  const p = user.profile || {};
  const [f, setF] = useState({
    name: user.name, phone: user.phone || '', ...p,
    skills: (p.skills || []).join(', '), interests: (p.interests || []).join(', '),
  });
  const [m, setM] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const F = [
    ['name', 'Full name'], ['phone', 'Phone'], ['college', 'College'], ['degree', 'Degree'],
    ['branch', 'Branch'], ['gradYear', 'Graduation year'], ['skills', 'Skills (comma separated)'],
    ['interests', 'Career interests (comma separated)'], ['targetRole', 'Target role'],
    ['resume', 'Resume link'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'],
  ];
  return (
    <>
      <Title>My profile</Title>
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { name, phone, ...profile } = f;
            setUser((await api.put('/auth/me', { name, phone, profile })).data);
            setM('Saved');
          } catch (x) { setM(errMsg(x)); }
        }}>
          <Field label="Email" value={user.email} disabled readOnly />
          {F.map(([k, l]) => <Field key={k} label={l} value={f[k] ?? ''} onChange={set(k)} />)}
          <div className="md:col-span-2">
            <Btn>Save changes</Btn>
            <span className="ml-3 text-sm text-mute">{m}</span>
          </div>
        </form>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRIVES (also used for Assessments mode)
// ─────────────────────────────────────────────────────────────────────────────
export function Drives({ mode }) {
  const [drives, , e1] = useLoad('/public/drives');
  const [enrs, reload] = useLoad('/student/enrollments');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const enrol = async (d) => {
    try {
      setErr('');
      if (d.price > 0) await pay('drive', d._id);
      else await api.post(`/student/drives/${d._id}/enroll`);
      reload();
    } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <Title sub={mode ? 'Open a drive to start its rounds' : 'Placement simulations you can join'}>
        {mode ? 'Assessments' : 'Placement drives'}
      </Title>
      <Err msg={err} />

      {/* Real drives from backend */}
      <Loading data={drives && enrs} error={e1}>
        {drives?.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-bold text-navy">Live Drives</h2>
            {drives.map((d) => {
              const en = enrs?.find((x) => x.drive._id === d._id);
              return (
                <Card key={d._id} className="mb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{d.title}</h3>
                      <p className="text-sm text-mute">{d.description}</p>
                      <p className="mt-1 text-sm">Eligibility: {d.eligibility || 'Open'} · {d.rounds.length} rounds · {d.rounds.reduce((s, r) => s + (r.duration || 0), 0)} min · {d.price ? `₹${d.price}` : 'Free'}</p>
                      <p className="mt-1 text-sm text-mute">{[...d.rounds].sort((a, b) => a.order - b.order).map((r) => r.name).join(' → ')}</p>
                    </div>
                    {en ? <Btn onClick={() => nav(`/app/enrollment/${en._id}`)}>Continue</Btn> : <Btn onClick={() => enrol(d)}>Enroll</Btn>}
                  </div>
                </Card>
              );
            })}
          </section>
        )}
      </Loading>

      {/* Demo drives */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-navy">Sample Placement Drives</h2>
          <DemoBanner label="Demo Drive — Sample Data" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_DRIVES.map((drive) => (
            <Card key={drive.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{drive.company}</h3>
                  <p className="font-semibold text-brand">{drive.role}</p>
                </div>
                <Badge tone={drive.statusTone}>{drive.status}</Badge>
              </div>
              <p className="text-sm text-mute">{drive.description}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-mute">
                <span className="flex items-center gap-1"><Briefcase size={11} />{drive.package}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{drive.location}</span>
                <span className="flex items-center gap-1"><Target size={11} />Eligibility: {drive.eligibility}</span>
                <span className="flex items-center gap-1"><Clock size={11} />Deadline: {drive.deadline}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {drive.skills.map((s) => (
                  <span key={s} className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-brand">{s}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-mute">
                Rounds: {drive.rounds.join(' → ')}
              </div>
              <p className="text-xs font-medium text-amber-700 bg-amber-50 rounded px-2 py-1">
                ⚠ Demo data — this is not a real job opportunity
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT
// ─────────────────────────────────────────────────────────────────────────────
export function Enrollment() {
  const { id } = useParams();
  const [en, , e] = useLoad(`/student/enrollments/${id}`);
  return (
    <Loading data={en} error={e}>
      <Title sub="Complete the rounds in order">{en?.drive.title}</Title>
      {en && [...en.drive.rounds].sort((a, b) => a.order - b.order).map((d) => {
        const r = en.rounds.find((x) => x.order === d.order);
        const open = r.status === 'open' || r.status === 'failed';
        return (
          <Card key={d.order} className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Round {d.order}: {d.name} <Badge tone={tone(r.status)}>{r.status}</Badge></h3>
                <p className="text-sm text-mute">{d.description} · {d.duration} min · pass mark {d.passingScore}%</p>
                {d.instructions && <p className="text-sm">{d.instructions}</p>}
                {r.score != null && <p className="text-sm font-semibold">Last score: {r.score}%</p>}
              </div>
              {open && (d.kind === 'mcq'
                ? <Link to={`/app/test/${id}/${d.order}`}><Btn>{r.status === 'failed' ? 'Retake' : 'Start'}</Btn></Link>
                : <Link to={`/app/book/${id}/${d.order}`}><Btn>{r.status === 'failed' ? 'Book again' : 'Book interview'}</Btn></Link>
              )}
            </div>
          </Card>
        );
      })}
      {en?.overall != null && <Link to={`/app/reports?e=${id}`}><Btn>View performance report</Btn></Link>}
    </Loading>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST (MCQ round)
// ─────────────────────────────────────────────────────────────────────────────
export function Test() {
  const { id, order } = useParams();
  const nav = useNavigate();
  const [t, setT] = useState(null);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState({});
  const [left, setLeft] = useState(0);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    api.post(`/student/enrollments/${id}/rounds/${order}/start`)
      .then((r) => setT(r.data))
      .catch((x) => setErr(errMsg(x)));
  }, [id, order]);

  const submit = async () => {
    if (sent.current) return;
    sent.current = true;
    try {
      setRes((await api.post(`/student/attempts/${t.attemptId}/submit`, { answers: ans })).data);
    } catch (x) { setErr(errMsg(x)); }
  };

  useEffect(() => {
    if (!t) return;
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(t.endsAt) - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit();
    };
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [t, ans]);

  if (err) return <><Err msg={err} /><Link className="text-brand" to={`/app/enrollment/${id}`}>Back</Link></>;
  if (res) return (
    <Card>
      <h2 className="text-2xl font-bold">{res.passed ? '✅ Round passed' : '❌ Not passed yet'} — {res.score}%</h2>
      <p className="mb-4 text-sm text-mute">Score breakdown by topic:</p>
      {Object.entries(res.topicScores).map(([k, v]) => <Bar key={k} label={k} value={v} />)}
      <Btn onClick={() => nav(`/app/enrollment/${id}`)}>Back to drive</Btn>
    </Card>
  );
  if (!t) return <p>Loading…</p>;
  const q = t.questions[i];
  const cur = ans[q.id] || [];
  const toggle = (k) => setAns({ ...ans, [q.id]: q.multi ? (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]) : [k] });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.name}</h1>
        <span className={`font-mono text-lg ${left < 60 ? 'text-red-600' : ''}`}>
          {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
        </span>
      </div>
      <Card>
        <p className="mb-1 text-xs text-mute">Question {i + 1} of {t.questions.length} · {q.topic}{q.multi && ' · select all that apply'}</p>
        <p className="mb-4 text-lg font-semibold">{q.text}</p>
        {q.options.map((o, k) => (
          <label key={k} className={`mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${cur.includes(k) ? 'border-brand bg-soft' : 'border-slate-200'}`}>
            <input type={q.multi ? 'checkbox' : 'radio'} checked={cur.includes(k)} onChange={() => toggle(k)} />{o}
          </label>
        ))}
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</Btn>
        <Btn variant="outline" disabled={i === t.questions.length - 1} onClick={() => setI(i + 1)}>Next</Btn>
        <div className="flex flex-wrap gap-1">
          {t.questions.map((x, k) => (
            <button key={x.id} aria-label={`Question ${k + 1}`} onClick={() => setI(k)}
              className={`h-8 w-8 rounded text-xs ${ans[x.id]?.length ? 'bg-brand text-white' : 'bg-slate-200'}`}>{k + 1}</button>
          ))}
        </div>
        <Btn className="ml-auto" onClick={() => confirm('Submit your answers?') && submit()}>Submit</Btn>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENTS (Demo interactive assessments)
// ─────────────────────────────────────────────────────────────────────────────
export function DemoAssessment({ assessment, onBack }) {
  const [phase, setPhase] = useState('intro'); // intro | quiz | result
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(assessment.questionsData.length * 60); // 60s per question
  const timerRef = useRef(null);
  // handleSubmit defined first so the useEffect closure can capture it
  const handleSubmit = () => {
    clearInterval(timerRef.current);
    setPhase('result');
  };

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = assessment.questionsData[current];
  const chosen = answers[q?.id];

  const score = (() => {
    let correct = 0;
    assessment.questionsData.forEach((q) => { if (answers[q.id] === q.correct) correct++; });
    return Math.round((correct / assessment.questionsData.length) * 100);
  })();

  if (phase === 'intro') return (
    <Card className="mx-auto max-w-2xl">
      <DemoBanner label="Demo Assessment — Not scored to your real profile" />
      <h2 className="mt-3 text-2xl font-bold text-navy">{assessment.title}</h2>
      <p className="mt-2 text-mute">{assessment.description}</p>
      <div className="my-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="rounded-lg bg-soft p-3"><p className="font-bold text-lg text-brand">{assessment.questionsData.length}</p><p className="text-mute">Questions</p></div>
        <div className="rounded-lg bg-soft p-3"><p className="font-bold text-lg text-brand">{assessment.duration}</p><p className="text-mute">Duration</p></div>
        <div className="rounded-lg bg-soft p-3"><Badge tone={assessment.difficultyTone}>{assessment.difficulty}</Badge><p className="mt-1 text-mute">Level</p></div>
      </div>
      <p className="mb-4 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">This is a sample demo assessment. Your answers are not saved to your real profile or records.</p>
      <div className="flex gap-3">
        <Btn onClick={() => setPhase('quiz')}>Start assessment</Btn>
        <Btn variant="outline" onClick={onBack}>← Back</Btn>
      </div>
    </Card>
  );

  if (phase === 'quiz') return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-navy">{assessment.title}</h2>
        <span className={`font-mono ${timeLeft < 30 ? 'text-red-600 font-bold' : 'text-mute'}`}>
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div className="mb-2 h-1.5 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((current + 1) / assessment.questionsData.length) * 100}%` }} />
      </div>
      <p className="mb-4 text-xs text-mute">Question {current + 1} of {assessment.questionsData.length}</p>
      <Card>
        <p className="mb-4 text-lg font-semibold">{q.text}</p>
        {q.options.map((opt, idx) => (
          <label key={idx} className={`mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${chosen === idx ? 'border-brand bg-soft' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" name={q.id} checked={chosen === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })}
              className="accent-blue-600" />
            <span>{opt}</span>
          </label>
        ))}
      </Card>
      <div className="mt-4 flex gap-3">
        <Btn variant="outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</Btn>
        {current < assessment.questionsData.length - 1
          ? <Btn onClick={() => setCurrent(current + 1)}>Next</Btn>
          : <Btn onClick={handleSubmit}>Submit answers</Btn>
        }
      </div>
    </div>
  );

  // Result phase
  const passed = score >= 60;
  return (
    <div className="mx-auto max-w-2xl">
      <DemoBanner label="Demo Result — Not saved to your real profile" />
      <Card className={`mt-3 border-2 ${passed ? 'border-green-400' : 'border-amber-400'}`}>
        <div className="mb-4 flex items-center gap-3">
          {passed ? <CheckCircle size={32} className="text-green-500" /> : <XCircle size={32} className="text-amber-500" />}
          <div>
            <h2 className="text-2xl font-bold">{passed ? 'Well done!' : 'Keep practising!'}</h2>
            <p className="text-mute">{assessment.title}</p>
          </div>
        </div>
        <div className="mb-4 text-center">
          <p className="font-display text-5xl font-bold text-navy">{score}<span className="text-xl text-mute">/100</span></p>
          <Badge tone={passed ? 'green' : 'amber'} className="mt-2">{passed ? 'Passed' : 'Needs Improvement'}</Badge>
        </div>
        <h3 className="mb-2 font-bold">Your answers</h3>
        {assessment.questionsData.map((aq, idx) => {
          const userAns = answers[aq.id];
          const isCorrect = userAns === aq.correct;
          return (
            <div key={aq.id} className={`mb-2 rounded-lg border p-3 text-sm ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="font-semibold">{idx + 1}. {aq.text}</p>
              <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                {isCorrect ? '✓ Correct' : `✗ Your answer: ${aq.options[userAns] ?? 'Not answered'}`}
              </p>
              {!isCorrect && <p className="text-green-700">Correct: {aq.options[aq.correct]}</p>}
            </div>
          );
        })}
        <h3 className="mb-2 mt-4 font-bold">Topic breakdown (demo sample data)</h3>
        {Object.entries(assessment.topicBreakdown).map(([topic, val]) => <Bar key={topic} label={topic} value={val} />)}
      </Card>
      <div className="mt-4 flex gap-3">
        <Btn onClick={() => { setPhase('intro'); setCurrent(0); setAnswers({}); setTimeLeft(assessment.questionsData.length * 60); }}>Retry</Btn>
        <Btn variant="outline" onClick={onBack}>← All assessments</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTORS page
// ─────────────────────────────────────────────────────────────────────────────
export function Mentors() {
  const [ms, , e] = useLoad('/public/mentors');
  const [expanded, setExpanded] = useState(null);

  return (
    <>
      <Title sub="Book a mock interview with a verified mentor from your enrolled drive">Mock interview mentors</Title>

      {/* Real mentors from backend */}
      <Loading data={ms} error={e}>
        {ms?.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-bold">Available Mentors</h2>
            {ms.map((m) => (
              <Card key={m._id} className="mb-3">
                <h3 className="font-bold">{m.name}
                  {m.isSample && <Badge tone="gray" className="ml-2">Demo profile</Badge>}
                </h3>
                <p className="text-sm text-mute">{m.mentor.title} at {m.mentor.company} · {m.mentor.years} yrs · {m.mentor.specialization}</p>
                <p className="text-sm">Expertise: {m.mentor.expertise || '—'} · {m.mentor.rate ? `₹${m.mentor.rate}` : 'Free'} · {m.slots.length} open slots</p>
              </Card>
            ))}
          </section>
        )}
      </Loading>

      {/* Demo mentors */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-bold">Sample Mentor Profiles</h2>
        <DemoBanner label="Demo Mentor — Sample Profile" />
      </div>
      <p className="mb-4 text-sm text-mute">To book a real interview, enroll in a placement drive and use the interview round booking.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_MENTORS.map((m) => (
          <Card key={m.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${m.avatarColor}`}>{m.avatar}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{m.name}</p>
                  <DemoBanner label="Demo" />
                </div>
                <p className="text-sm text-brand font-semibold">{m.role}</p>
                <p className="text-xs text-mute">{m.company}</p>
              </div>
            </div>
            <StarRating rating={m.rating} />
            <p className="text-sm text-mute">{m.bio}</p>
            <div className="flex flex-wrap gap-1">
              {m.skills.map((s) => <span key={s} className="rounded-full bg-soft px-2 py-0.5 text-xs font-medium text-brand">{s}</span>)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-mute">
              <span className="flex items-center gap-1"><Briefcase size={11} />{m.years} years exp.</span>
              <span className="flex items-center gap-1"><Users size={11} />{m.sessions} sessions</span>
              <span className="flex items-center gap-1"><Calendar size={11} />{m.availability}</span>
              <span className="flex items-center gap-1 font-semibold text-brand">💰 {m.rate}</span>
            </div>
            <button
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            >
              <span className="font-semibold">Expertise details</span>
              {expanded === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded === m.id && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p><span className="font-semibold">Expertise: </span>{m.expertise}</p>
                <p className="mt-1"><span className="font-semibold">Reviews: </span>{m.reviews} students</p>
                <p className="mt-2 text-xs text-amber-700">To book this mentor, enroll in a placement drive with an interview round.</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK (Interview booking)
// ─────────────────────────────────────────────────────────────────────────────
export function Book() {
  const { id, order } = useParams();
  const nav = useNavigate();
  const [ms, load, e] = useLoad('/public/mentors');
  const [err, setErr] = useState('');

  const book = async (slot) => {
    try {
      setErr('');
      const b = (await api.post('/student/bookings', { slotId: slot._id, enrollmentId: id, order })).data;
      if (b.status === 'awaiting_payment') await pay('booking', b._id);
      nav('/app/bookings');
    } catch (x) { setErr(errMsg(x)); load(); }
  };

  return (
    <>
      <Title sub="Times are shown in your local time zone">Book an interview</Title>
      <Err msg={err} />
      <Loading data={ms} error={e}>
        {ms?.length === 0 && <Empty>No mentors with open slots yet.</Empty>}
        {ms?.map((m) => (
          <Card key={m._id} className="mb-3">
            <h3 className="font-bold">{m.name}
              <span className="ml-2 text-sm font-normal text-mute">{m.mentor.title}, {m.mentor.company} · {m.mentor.rate ? `₹${m.mentor.rate}` : 'Free'}</span>
            </h3>
            <p className="mb-2 text-sm text-mute">{m.mentor.specialization} · {m.mentor.expertise}</p>
            <div className="flex flex-wrap gap-2">
              {m.slots.length
                ? m.slots.map((s) => <Btn key={s._id} variant="outline" onClick={() => book(s)}>{fmt(s.start)}</Btn>)
                : <span className="text-sm text-mute">No open slots</span>}
            </div>
          </Card>
        ))}
      </Loading>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────
export function Bookings() {
  const [bs, load, e] = useLoad('/student/bookings');
  const [err, setErr] = useState('');

  return (
    <>
      <Title sub="Cancel up to 2 hours before. To reschedule, cancel and book a new slot.">Interview bookings</Title>
      <Err msg={err} />

      {/* Real bookings */}
      <Loading data={bs} error={e}>
        {bs?.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 font-bold">My Bookings</h2>
            {bs.map((b) => (
              <Card key={b._id} className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>{b.enrollment?.drive?.title}</b> · Round {b.order}{' '}
                  <Badge tone={tone(b.status)}>{b.status}</Badge>
                  <p className="text-sm text-mute">{b.slot && fmt(b.slot.start)} with {b.mentor?.name}</p>
                </div>
                <div className="flex gap-2">
                  {b.status === 'accepted' && b.meetingUrl && (
                    <a href={b.meetingUrl} target="_blank" rel="noreferrer"><Btn>Join interview</Btn></a>
                  )}
                  {['awaiting_payment', 'requested', 'accepted'].includes(b.status) && (
                    <Btn variant="outline" onClick={async () => {
                      try { await api.patch(`/student/bookings/${b._id}/cancel`); load(); }
                      catch (x) { setErr(errMsg(x)); }
                    }}>Cancel</Btn>
                  )}
                  {b.status === 'awaiting_payment' && (
                    <Btn onClick={async () => {
                      try { await pay('booking', b._id); load(); }
                      catch (x) { setErr(errMsg(x)); }
                    }}>Pay ₹{b.price}</Btn>
                  )}
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <Empty className="mb-8">No real bookings yet. Enroll in a drive with an interview round to book.</Empty>
        )}
      </Loading>

      {/* Demo booking cards */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-bold">Sample Interview Bookings</h2>
        <DemoBanner label="Demo Bookings — Sample Interface" />
      </div>
      <p className="mb-4 text-sm text-mute">This is how your booking cards will look once you enroll and book interviews.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_BOOKINGS.map((b) => (
          <Card key={b.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{b.mentor}</p>
                <p className="text-xs text-mute">{b.mentorRole}</p>
              </div>
              <Badge tone={b.statusTone}>{b.status}</Badge>
            </div>
            <div className="text-sm">
              <p><span className="font-semibold">Interview type: </span>{b.interviewType}</p>
              <p><span className="font-semibold">Drive: </span>{b.drive}</p>
              <p className="flex items-center gap-1 mt-1 text-mute"><Calendar size={13} />{b.scheduledFor} · {b.duration}</p>
            </div>
            {b.notes && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">📝 {b.notes}</p>}
            <div className="flex gap-2">
              {b.status === 'Confirmed' && (
                <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white opacity-50 cursor-not-allowed" disabled>
                  Join interview (demo)
                </button>
              )}
              <span className="text-xs italic text-mute self-center">Demo — not a real booking</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK INTERVIEWS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function MockInterviews() {
  const [selected, setSelected] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (selected) {
    const mi = DEMO_MOCK_INTERVIEWS.find((x) => x.id === selected);
    return (
      <div className="mx-auto max-w-3xl">
        <button onClick={() => { setSelected(null); setExpandedQ(null); setShowFeedback(false); }}
          className="mb-4 flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          ← Back to categories
        </button>
        <DemoBanner label="Demo Mock Interview — Sample Questions" />
        <div className="mt-3 mb-6">
          <h2 className="text-2xl font-bold text-navy">{mi.icon} {mi.category}</h2>
          <p className="text-mute mt-1">{mi.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <Badge tone={mi.difficultyTone}>{mi.difficulty}</Badge>
            <span className="text-mute flex items-center gap-1"><Clock size={13} />{mi.duration}</span>
          </div>
        </div>

        <h3 className="mb-3 font-bold">Practice Questions</h3>
        {mi.questions.map((item, idx) => (
          <Card key={idx} className="mb-3">
            <button className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}>
              <span className="font-semibold">Q{idx + 1}. {item.q}</span>
              {expandedQ === idx ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
            </button>
            {expandedQ === idx && (
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-900">
                <p className="font-semibold mb-1">💡 Hint:</p>
                <p>{item.hint}</p>
              </div>
            )}
          </Card>
        ))}

        <div className="mt-6">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => setShowFeedback(!showFeedback)}>
            {showFeedback ? 'Hide' : 'View'} sample feedback
            {showFeedback ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showFeedback && (
            <Card className="mt-3 border-2 border-dashed border-amber-300">
              <DemoBanner label="Demo Feedback — Sample Only" />
              <div className="mt-3 flex items-center gap-3">
                <div>
                  <p className="font-display text-3xl font-bold text-navy">{mi.sampleFeedback.score}<span className="text-base text-mute">/100</span></p>
                  <Badge tone={mi.sampleFeedback.score >= 75 ? 'green' : mi.sampleFeedback.score >= 60 ? 'blue' : 'amber'}>{mi.sampleFeedback.level}</Badge>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="font-semibold text-green-800 mb-1">✅ Strengths</p>
                  <p>{mi.sampleFeedback.strengths}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="font-semibold text-red-800 mb-1">⚠ Areas to improve</p>
                  <p>{mi.sampleFeedback.weaknesses}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="font-semibold text-blue-800 mb-1">📝 Recommendations</p>
                  <p>{mi.sampleFeedback.recommendations}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card className="mt-6 bg-navy text-white">
          <h3 className="font-bold mb-1">Ready for a real mock interview?</h3>
          <p className="text-sm text-slate-300 mb-3">Enroll in a placement drive with an interview round to book a session with a verified mentor.</p>
          <Link to="/app/drives"><Btn className="bg-brand hover:bg-blue-500">Browse placement drives</Btn></Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Title sub="Practice common interview questions across categories">Mock interviews</Title>
      <DemoBanner label="Demo Mock Interviews — Sample Questions & Feedback" />
      <p className="mt-2 mb-6 text-sm text-mute">
        Browse practice questions by category. To book a real 1-on-1 mock interview with a verified mentor,{' '}
        <Link to="/app/drives" className="text-brand font-semibold hover:underline">enroll in a placement drive</Link>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DEMO_MOCK_INTERVIEWS.map((mi) => (
          <button key={mi.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex w-full cursor-pointer flex-col gap-3 text-left transition hover:shadow-md hover:border-brand/40"
            onClick={() => setSelected(mi.id)}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{mi.icon}</span>
              <div>
                <p className="font-bold">{mi.category}</p>
                <p className="text-sm text-mute">{mi.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
              <Badge tone={mi.difficultyTone}>{mi.difficulty}</Badge>
              <span className="flex items-center gap-1"><Clock size={11} />{mi.duration}</span>
              <span>{mi.questions.length} questions</span>
            </div>
            <Btn variant="outline" className="w-full text-sm pointer-events-none">Practice now →</Btn>
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function Report({ improve }) {
  const [sp] = useSearchParams();
  const [enrs] = useLoad('/student/enrollments');
  const [sel, setSel] = useState(sp.get('e'));
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  const eid = sel || enrs?.find((x) => x.overall != null)?._id;

  useEffect(() => {
    if (eid) api.get(`/student/enrollments/${eid}/report`).then((x) => setR(x.data)).catch((x) => setErr(errMsg(x)));
  }, [eid]);

  const issue = async () => {
    try {
      const c = (await api.post(`/student/enrollments/${eid}/certificate`)).data;
      nav(`/app/certificate/${c.certId}`);
    } catch (x) { setErr(errMsg(x)); }
  };

  const hasRealReport = !!r;

  return (
    <>
      <div className="flex items-center justify-between print:hidden">
        <Title>{improve ? 'Skill improvement' : 'Performance report'}</Title>
        {!improve && hasRealReport && <Btn variant="outline" onClick={() => window.print()}>Download PDF</Btn>}
      </div>
      <Err msg={err} />

      {/* Real report */}
      {hasRealReport && (
        <>
          <Card className="mb-4">
            <p className="text-sm text-mute">{r.student} · {r.drive}</p>
            <p className="font-display text-4xl font-bold text-navy">{r.overall ?? '—'}<span className="text-base text-mute">/100</span></p>
            <Badge>{r.level || 'In progress'}</Badge>
            <p className="mt-2 text-xs text-mute">Percentile ranking is not shown until enough comparison data exists.</p>
          </Card>
          {!improve && (
            <Card className="mb-4">
              <h3 className="mb-3 font-bold">Rounds</h3>
              {r.rounds.map((x) => <Bar key={x.order} label={`${x.name} (${x.status})`} value={x.score ?? 0} />)}
            </Card>
          )}
          <Card className="mb-4">
            <h3 className="mb-3 font-bold">Skills</h3>
            {Object.keys(r.skills).length
              ? Object.entries(r.skills).map(([k, v]) => <Bar key={k} label={k} value={v} />)
              : <p className="text-mute">No skill data yet.</p>}
          </Card>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Card><h3 className="font-bold text-green-700">Strong skills</h3><p>{r.strong.join(', ') || '—'}</p></Card>
            <Card><h3 className="font-bold text-red-700">Skills to improve</h3><p>{r.weak.join(', ') || '—'}</p></Card>
          </div>
          {r.evaluations.map((v, i) => (
            <Card key={i} className="mb-3">
              <h3 className="font-bold">{v.type} interview feedback ({v.total}/100)</h3>
              <p className="text-sm">{v.feedback}</p>
              <p className="text-sm"><b>Strengths:</b> {v.strengths}</p>
              <p className="text-sm"><b>Weaknesses:</b> {v.weaknesses}</p>
              <p className="text-sm"><b>Recommendations:</b> {v.recommendations}</p>
            </Card>
          ))}
          {r.retakeAfter && <Card className="mb-3 bg-amber-50"><b>Recommended retake date:</b> {new Date(r.retakeAfter).toLocaleDateString()}</Card>}
          {r.certEligible && <Btn className="print:hidden" onClick={issue}>Get my certificate</Btn>}
        </>
      )}

      {/* Demo report (shown when no real report, or toggled) */}
      {!hasRealReport && enrs != null && (
        <>
          <div className="mb-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-mute">
            Complete all rounds of a placement drive to see your real report.
            <br />
            <Link className="mt-2 inline-block text-brand font-semibold hover:underline" to="/app/drives">Browse placement drives</Link>
          </div>
          <button onClick={() => setShowDemo(!showDemo)}
            className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            {showDemo ? 'Hide' : 'See'} demo sample report {showDemo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </>
      )}

      {(showDemo || (hasRealReport && improve)) && (
        <div className="mt-2">
          <DemoBanner label="Demo Report — Sample Data Only" />
          <Card className="mt-3 mb-4 border-2 border-dashed border-amber-200">
            <p className="text-sm text-mute mb-1">{DEMO_REPORTS.student} · {DEMO_REPORTS.drive}</p>
            <p className="font-display text-4xl font-bold text-navy">{DEMO_REPORTS.overall}<span className="text-base text-mute">/100</span></p>
            <Badge tone="green">{DEMO_REPORTS.level}</Badge>
          </Card>
          {!improve && (
            <Card className="mb-4 border-dashed border-amber-200 border-2">
              <p className="text-xs text-amber-700 mb-3 font-semibold">Demo rounds breakdown</p>
              {DEMO_REPORTS.rounds.map((x) => <Bar key={x.name} label={`${x.name} (${x.status})`} value={x.score} />)}
            </Card>
          )}
          <Card className="mb-4 border-dashed border-amber-200 border-2">
            <p className="text-xs text-amber-700 mb-3 font-semibold">Demo skill scores</p>
            {Object.entries(DEMO_REPORTS.skills).map(([k, v]) => (
              <SkillBar key={k} label={k} value={v} tone={v >= 75 ? 'green' : v >= 60 ? 'brand' : 'amber'} />
            ))}
          </Card>
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Card className="border-dashed border-green-300 border-2">
              <h3 className="font-bold text-green-700 mb-2">✅ Strong skills</h3>
              <div className="flex flex-wrap gap-1">
                {DEMO_REPORTS.strong.map((s) => <Badge key={s} tone="green">{s}</Badge>)}
              </div>
            </Card>
            <Card className="border-dashed border-red-200 border-2">
              <h3 className="font-bold text-red-700 mb-2">⚠ Skills to improve</h3>
              <div className="flex flex-wrap gap-1">
                {DEMO_REPORTS.weak.map((s) => <Badge key={s} tone="red">{s}</Badge>)}
              </div>
            </Card>
          </div>
          {DEMO_REPORTS.evaluations.map((v, i) => (
            <Card key={i} className="mb-3 border-dashed border-amber-200 border-2">
              <DemoBanner label="Demo Interview Feedback" />
              <h3 className="mt-2 font-bold">{v.type} interview feedback ({v.total}/100)</h3>
              <p className="text-sm mt-1">{v.feedback}</p>
              <p className="text-sm mt-1"><b>Strengths:</b> {v.strengths}</p>
              <p className="text-sm mt-1"><b>Areas for improvement:</b> {v.weaknesses}</p>
              <p className="text-sm mt-1"><b>Recommendations:</b> {v.recommendations}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Skill improvement recommendations (always shown on /app/improvement) */}
      {improve && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Skill improvement plan</h2>
          <DemoBanner label="Demo Recommendations" />
          <div className="mt-3 space-y-4">
            {DEMO_SKILL_RECOMMENDATIONS.map((s) => (
              <Card key={s.skill}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">{s.skill}</h3>
                  <Badge tone={s.current >= s.target ? 'green' : s.current >= 70 ? 'blue' : s.current >= 55 ? 'amber' : 'red'}>
                    {s.current}% / {s.target}% target
                  </Badge>
                </div>
                <SkillBar label="" value={s.current} target={s.target}
                  tone={s.current >= s.target ? 'green' : s.current >= 70 ? 'brand' : s.current >= 55 ? 'amber' : 'red'} />
                <div className="mt-2">
                  <p className="text-xs font-semibold text-mute mb-1">Recommended resources:</p>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {s.resources.map((res) => <li key={res} className="text-brand">{res}</li>)}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────────────────────────────────────
export function Certificates() {
  const [cs, , e] = useLoad('/student/certificates');
  const [err, setErr] = useState('');
  const [message, setMessage] = useState('');

  return (
    <>
      <Title>Certificates</Title>
      <Err msg={err} />
      <p className="mb-2 text-sm text-green-700" role="status">{message}</p>

      {/* Real certificates */}
      <Loading data={cs} error={e}>
        {cs?.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 font-bold">My Certificates</h2>
            {cs.map((c) => (
              <Card key={c._id} className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>{c.drive?.title}</b>
                  <p className="text-sm text-mute">ID {c.certId} · {c.level} · {c.score}/100</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/app/certificate/${c.certId}`}><Btn>View / PDF</Btn></Link>
                  <Btn variant="outline" onClick={async () => {
                    try {
                      setErr('');
                      await navigator.clipboard.writeText(`${location.origin}/verify/${c.certId}`);
                      setMessage('Verification link copied.');
                    } catch (x) { setMessage(''); setErr(errMsg(x)); }
                  }}>Copy link</Btn>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-slate-300 p-5 text-center text-mute">
            No real certificates yet. Complete all rounds of a placement drive and reach the minimum readiness level to earn one.
          </div>
        )}
      </Loading>

      {/* Demo certificates */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-bold">Sample Certificate</h2>
        <DemoBanner label="Demo Certificate — Not a real certificate" />
      </div>
      {DEMO_CERTIFICATES.map((c) => (
        <Card key={c.id} className="mb-4 border-2 border-dashed border-amber-300">
          <DemoBanner label="Demo Certificate — Sample Only" />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">{c.drive}</h3>
              <p className="text-mute text-sm">Certificate ID: {c.certId}</p>
              <div className="mt-2 flex items-center gap-3">
                <Badge tone="green">{c.level}</Badge>
                <span className="text-sm font-bold">{c.score}/100</span>
                <span className="text-xs text-mute">Issued: {c.issuedDate}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.skills.map((s) => <span key={s} className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700">{s}</span>)}
              </div>
            </div>
            <div className="rounded-2xl border-4 border-navy p-4 text-center min-w-[160px]">
              <p className="font-display text-xs font-extrabold text-navy">SkillBridge</p>
              <p className="text-[10px] text-mute mt-0.5">Placement Readiness</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand">{c.score}</p>
              <p className="text-xs text-mute">/ 100</p>
              <Badge tone="green" className="mt-1">{c.level}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">Skill improvement recommendations:</h4>
            <ul className="space-y-1">
              {c.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Zap size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            This is a demo sample certificate. Real certificates are issued only when you complete a placement drive at the required readiness level.
          </p>
        </Card>
      ))}

      <Card className="mt-4 bg-soft border-brand/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Earn a real certificate</h3>
            <p className="text-sm text-mute">Complete all rounds of a placement drive and reach "Placement Ready" level.</p>
          </div>
          <Link to="/app/drives"><Btn>Browse drives</Btn></Link>
        </div>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function CertificateView() {
  const { certId } = useParams();
  const [c, , e] = useLoad(`/student/certificates/${certId}`);
  const url = `${location.origin}/verify/${certId}`;
  return (
    <Loading data={c} error={e}>
      {c && (
        <>
          <Btn className="mb-4 print:hidden" onClick={() => window.print()}>Download PDF (Save as PDF)</Btn>
          <div className="rounded-2xl border-4 border-navy bg-white p-10 text-center">
            <p className="font-display text-xl font-extrabold text-navy">SkillBridge</p>
            <h1 className="my-4 text-3xl font-bold text-navy">Placement Readiness Certification — {c.drive.title}</h1>
            <p>This certifies that</p>
            <p className="my-2 font-display text-4xl font-bold text-brand">{c.student.name}</p>
            <p>achieved an overall score of <b>{c.score}/100</b> and the level <b>{c.level}</b></p>
            <div className="my-6 flex justify-center"><QRCodeSVG value={url} size={110} /></div>
            <p className="text-sm">Certificate ID: <b>{c.certId}</b> · Issued {new Date(c.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-mute">Verify at {url}</p>
            <p className="mx-auto mt-4 max-w-lg text-xs text-mute">
              This certification represents SkillBridge's own assessment and is not certification by Google, Microsoft, Amazon or any other employer.
            </p>
          </div>
        </>
      )}
    </Loading>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
export function Payments() {
  const [ps, , e] = useLoad('/student/payments');
  return (
    <>
      <Title>Payments</Title>
      <Loading data={ps} error={e}>
        {ps?.length
          ? ps.map((p) => (
            <Card key={p._id} className="mb-2 flex justify-between">
              <span>{p.type} · ₹{p.amount} · {fmt(p.createdAt)}{p.dev && ' (dev)'}</span>
              <Badge tone={tone(p.status)}>{p.status}</Badge>
            </Card>
          ))
          : <Empty>No payments yet.</Empty>}
      </Loading>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export function Settings() {
  const [ns, load, e] = useLoad('/auth/notifications');
  const [err, setErr] = useState('');
  return (
    <>
      <Title>Settings</Title>
      <Err msg={err} />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Notifications</h2>
        <Btn variant="outline" onClick={async () => {
          try { setErr(''); await api.post('/auth/notifications/read'); load(); }
          catch (x) { setErr(errMsg(x)); }
        }}>Mark all read</Btn>
      </div>
      <Loading data={ns} error={e}>
        {ns?.length
          ? ns.map((n) => (
            <Card key={n._id} className={`mb-2 ${n.read ? '' : 'border-brand'}`}>
              <b>{n.title}</b>
              <p className="text-sm text-mute">{n.body} · {fmt(n.createdAt)}</p>
            </Card>
          ))
          : <Empty>No notifications.</Empty>}
      </Loading>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENTS PAGE (wraps real drives + demo interactive assessments)
// ─────────────────────────────────────────────────────────────────────────────
export function AssessmentsPage() {
  const [selected, setSelected] = useState(null);
  const [drives, , e1] = useLoad('/public/drives');
  const [enrs, reload] = useLoad('/student/enrollments');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  // If a demo assessment is selected, show interactive quiz
  if (selected) {
    return <DemoAssessment assessment={selected} onBack={() => setSelected(null)} />;
  }

  const enrol = async (d) => {
    try {
      setErr('');
      if (d.price > 0) await pay('drive', d._id);
      else await api.post(`/student/drives/${d._id}/enroll`);
      reload();
    } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <Title sub="Practice with timed MCQ assessments">Assessments</Title>
      <Err msg={err} />

      {/* Real MCQ drives */}
      <Loading data={drives && enrs} error={e1}>
        {drives?.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-base font-bold text-navy">Live Assessment Drives</h2>
            {drives.map((d) => {
              const en = enrs?.find((x) => x.drive._id === d._id);
              return (
                <Card key={d._id} className="mb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{d.title}</h3>
                      <p className="text-sm text-mute">{d.description}</p>
                      <p className="mt-1 text-sm">
                        Eligibility: {d.eligibility || 'Open'} · {d.rounds.length} rounds · {d.rounds.reduce((s, r) => s + (r.duration || 0), 0)} min · {d.price ? `₹${d.price}` : 'Free'}
                      </p>
                    </div>
                    {en
                      ? <Btn onClick={() => nav(`/app/enrollment/${en._id}`)}>Continue</Btn>
                      : <Btn onClick={() => enrol(d)}>Enroll</Btn>}
                  </div>
                </Card>
              );
            })}
          </section>
        )}
      </Loading>

      {/* Demo assessments */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-navy">Practice Assessments</h2>
          <DemoBanner label="Demo Assessments — Not scored to your real profile" />
        </div>
        <p className="mb-4 text-sm text-mute">
          These sample assessments let you practice. Your answers are not saved to your real profile.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {DEMO_ASSESSMENTS.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold leading-snug">{a.title}</h3>
                <Badge tone={a.difficultyTone}>{a.difficulty}</Badge>
              </div>
              <p className="text-sm text-mute">{a.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
                <span className="flex items-center gap-1"><BookOpen size={11} />{a.questions} questions</span>
                <span className="flex items-center gap-1"><Clock size={11} />{a.duration}</span>
              </div>
              <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs">
                <span className="font-semibold text-mute">Sample score: </span>
                <Badge tone={a.sampleResultTone}>{a.sampleScore}% — {a.sampleResult}</Badge>
              </div>
              <Btn className="mt-auto w-full" onClick={() => setSelected(a)}>
                Attempt now →
              </Btn>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
