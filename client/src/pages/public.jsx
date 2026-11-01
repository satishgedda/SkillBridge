import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Menu, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth';
import { api, errMsg, fmt } from '../api';
import { Badge, Btn, Card, Err } from '../ui';
const NAV = [['/', 'Home'], ['/how-it-works', 'How It Works'], ['/colleges', 'For Colleges'], ['/mentors', 'Become a Mentor']];
export function PublicLayout() {
  const { user } = useAuth(); const [o, setO] = useState(false);
  return <div><header className="sticky top-0 z-20 bg-navy text-white"><div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4">
    <Link to="/" className="font-display text-xl font-extrabold">Skill<span className="text-blue-300">Bridge</span></Link>
    <nav id="public-navigation" className={`${o ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col gap-3 bg-navy p-4 text-sm md:static md:ml-auto md:flex md:flex-row md:items-center md:p-0`}>
      {NAV.map(([t, l]) => <Link key={t} to={t} onClick={() => setO(false)} className="opacity-85 hover:opacity-100">{l}</Link>)}
      {user
        ? <Link className="rounded-lg bg-brand px-4 py-2 text-center font-semibold" to="/app" onClick={() => setO(false)}>Dashboard</Link>
        : <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Link className="rounded-lg border border-white/40 px-4 py-2 text-center font-semibold hover:bg-white/10" to="/login" onClick={() => setO(false)}>Log in</Link>
          <Link className="rounded-lg bg-brand px-4 py-2 text-center font-semibold hover:bg-blue-700" to="/register/student" onClick={() => setO(false)}>Create account</Link>
        </div>}
    </nav>
    <button className="ml-auto rounded-lg p-2 hover:bg-white/10 md:hidden" aria-label={o ? 'Close menu' : 'Open menu'} aria-expanded={o} aria-controls="public-navigation" onClick={() => setO(!o)}>{o ? <X /> : <Menu />}</button></div></header>
    <Outlet />
    <footer className="bg-[#0A1228] py-10 text-sm text-slate-400"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-8 px-4">
      <div><div className="font-display text-lg font-extrabold text-white">SkillBridge</div><p>Bridging Students to Industry.</p><p>© {new Date().getFullYear()} SkillBridge</p></div>
      <div className="space-y-1"><Link className="block" to="/about">About</Link><Link className="block" to="/services">Services</Link><Link className="block" to="/colleges">For Colleges</Link><Link className="block" to="/mentors">Become a Mentor</Link></div>
      <div className="space-y-1"><Link className="block" to="/contact">Contact</Link><Link className="block" to="/privacy">Privacy Policy</Link><Link className="block" to="/terms">Terms and Conditions</Link></div>
      <div className="space-y-1"><a className="block" href="https://www.linkedin.com">LinkedIn</a><a className="block" href="https://www.instagram.com">Instagram</a></div></div></footer></div>;
}
const STEPS = [['Register', 'Create your profile and target role'], ['Assess', 'Complete the skill assessment'], ['Mock interview', 'Attend a 1-on-1 round'], ['Feedback', 'Receive a professional scorecard'], ['Improve', 'Work on your skill gaps'], ['Reassess', 'Measure your progress'], ['Certify', 'Earn a readiness certificate']];
const SERVICES = [['Technical mock interviews', 'Live rounds with verified industry mentors.'], ['HR interviews', 'Behavioural and communication practice.'], ['Placement assessments', 'Timed aptitude and technical multiple-choice rounds.'], ['Mentor feedback', 'Structured scorecards to help focus your next steps.'], ['College programs', 'Placement-readiness tracking for student cohorts.']];
export function Home() {
  return <div>
    <section className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">Practice with purpose</p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">Build the confidence to take your next career step.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">SkillBridge helps students prepare for placements through focused assessments, mock interviews with industry mentors, and clear feedback on what to improve.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register/student" className="rounded-lg bg-brand px-5 py-3 font-semibold hover:bg-blue-700">Create account</Link>
            <Link to="/login" className="rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">Log in</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-xl font-bold">A clearer path from learning to work</h2>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
            <li><span className="font-semibold text-white">Practice skills</span><br />Take structured placement assessments and see results by topic.</li>
            <li><span className="font-semibold text-white">Meet industry mentors</span><br />Book mock interviews with verified professionals.</li>
            <li><span className="font-semibold text-white">Know what to improve</span><br />Use practical scorecards to focus your next steps.</li>
          </ul>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-navy">Built for students, mentors, and colleges</h2>
        <p className="mt-3 leading-relaxed text-mute">Students get a safe place to prepare. Mentors share real-world experience. Colleges can support and track placement readiness across their cohorts.</p>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {[
          ['Students', 'Explore placement drives, practice assessments, and prepare with mentor feedback.', 'student', 'Create a student account'],
          ['Mentors', 'Support learners with structured mock interviews and actionable scorecards.', 'mentor', 'Join as a mentor'],
          ['Colleges', 'Help students prepare and follow cohort progress with shared readiness insights.', 'college', 'Register your college'],
        ].map(([title, description, role, action]) => <Card key={role} className="flex h-full flex-col">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{description}</p>
          <Link className="mt-5 font-semibold text-brand hover:underline" to={`/register/${role}`}>{action} <span aria-hidden="true">→</span></Link>
        </Card>)}
      </div>
    </section>
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
        <h2 className="text-2xl font-bold text-navy">How to get started</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ['01', 'Create your account', 'Choose your role and add the essential details.'],
            ['02', 'Practice and connect', 'Students can start with an assessment and book an available mentor.'],
            ['03', 'Use your feedback', 'Review your results, work on skill gaps, and keep building confidence.'],
          ].map(([number, title, description]) => <div key={number} className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft font-bold text-brand">{number}</span>
            <div><h3 className="font-bold text-navy">{title}</h3><p className="mt-1 text-sm leading-relaxed text-mute">{description}</p></div>
          </div>)}
        </div>
      </div>
    </section>
  </div>;
}
const PAGES = {
  about: ['About SkillBridge', ['SkillBridge is a placement-readiness platform that connects engineering students with industry professionals for realistic placement simulations.', 'Students practise, get structured feedback, close their gaps and reassess. Colleges get cohort-level visibility. Our aim is to be the trusted bridge between academic institutions and industry.']],
  'how-it-works': ['How it works', STEPS.map(([t, d], i) => `${i + 1}. ${t}: ${d}.`)],
  services: ['Services', SERVICES.map(([t, d]) => `${t}: ${d}`)],
  pricing: ['Pricing', ['Placement drives and mentor interviews are priced individually by SkillBridge admins and shown before you pay. Some drives may be free.', 'College access is approved by an administrator. Subscription billing is not currently available in the app; ask your SkillBridge administrator about institutional pricing.']],
  colleges: ['For colleges', ['Student assessment, cohort tracking, department-level analytics, placement-readiness reports and an annual institutional subscription.', 'Colleges register and are activated after admin approval. Then you can add students, upload a CSV list, assign drives and view analytics.']],
  mentors: ['Become a mentor', ['Register with your professional details. An admin verifies every mentor before they can run paid interviews.', 'Set your availability, accept bookings, conduct interviews, submit structured scorecards and earn a share of each session.']],
  certification: ['Certification', ['A placement readiness score is calculated from weighted assessment and interview scores. Certificates are issued only when the score reaches the minimum level set by SkillBridge.', 'Every certificate has a unique ID, QR code and public verification page.', 'SkillBridge certificates represent SkillBridge\'s own assessment. They are not certifications from Google, Microsoft, Amazon or any employer.']],
  contact: ['Contact', ['A support email has not been configured yet. Please contact the SkillBridge administrator who provided your access.', 'Colleges and mentors: use the registration forms to apply.']],
  privacy: ['Privacy Policy', ['Draft: replace this text with your reviewed privacy policy before launch. Describe what data you collect (profile, assessment, interview and payment records), why, how long you keep it, and how users can request deletion.']],
  terms: ['Terms and Conditions', ['Draft: replace this text with your reviewed terms before launch. Cover accounts, payments and refunds, interview cancellation, certificate use and limits of liability.']],
};
export function Info({ slug }) { const [t, ps] = PAGES[slug];
  return <div className="mx-auto max-w-3xl px-4 py-14"><h1 className="mb-6 text-4xl font-extrabold text-navy">{t}</h1>{ps.map((p) => <p key={p} className="mb-3 text-lg text-slate-700">{p}</p>)}
    {['pricing', 'colleges', 'mentors'].includes(slug) && <Link to={`/register/${slug === 'pricing' ? 'student' : slug === 'colleges' ? 'college' : 'mentor'}`}><Btn className="mt-4">Get started</Btn></Link>}</div>; }
export function Verify() {
  const { id } = useParams(); const [c, setC] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { api.get(`/public/verify/${id}`).then((r) => setC(r.data)).catch((e) => setErr(errMsg(e))); }, [id]);
  return <div className="mx-auto max-w-xl px-4 py-14"><h1 className="mb-4 text-3xl font-bold text-navy">Certificate verification</h1><Err msg={err} />
    {c && <Card><div className="mb-3 flex items-center gap-2"><CheckCircle2 className={c.status === 'valid' ? 'text-green-600' : 'text-red-600'} /><Badge tone={c.status === 'valid' ? 'green' : 'red'}>{c.status === 'valid' ? 'Valid' : 'Revoked'}</Badge></div>
      <dl className="space-y-2 text-sm">{[['Certificate ID', c.certId], ['Student', c.student], ['Certification', c.title], ['Issued', fmt(c.issued)], ['Assessment result', `${c.score}/100 — ${c.level}`]].map(([k, v]) => <div key={k}><dt className="text-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-mute">{c.disclaimer}</p></Card>}</div>;
}
