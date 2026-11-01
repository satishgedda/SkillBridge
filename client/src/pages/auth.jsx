import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../api';
import { Btn, Card, Err, Field } from '../ui';

const ROLES = {
  student: 'Student',
  mentor: 'Mentor',
  college: 'College',
};

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;
  return <div className="mx-auto max-w-md px-4 py-16">
    <Card>
      <h1 className="mb-1 text-2xl font-bold text-navy">Welcome back</h1>
      <p className="mb-5 text-sm text-mute">Log in to continue to your SkillBridge dashboard.</p>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setErr('');
        setBusy(true);
        try {
          await login(f.email, f.password);
          nav('/app', { replace: true });
        } catch (x) {
          setErr(errMsg(x));
        } finally {
          setBusy(false);
        }
      }}>
        <Field label="Email" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label="Password" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Err msg={err} />
        <Btn className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Btn>
      </form>
      <p className="mt-5 text-sm text-mute">New to SkillBridge? <Link className="font-semibold text-brand" to="/register/student">Create an account</Link></p>
    </Card>
  </div>;
}

export function Register() {
  const { role } = useParams();
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', collegeName: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!Object.hasOwn(ROLES, role)) return <Navigate to="/register/student" replace />;
  if (user) return <Navigate to="/app" replace />;

  const isCollege = role === 'college';
  return <div className="mx-auto max-w-lg px-4 py-12">
    <Card>
      <h1 className="mb-1 text-2xl font-bold text-navy">Create your {ROLES[role].toLowerCase()} account</h1>
      <p className="mb-5 text-sm text-mute">Start with the essentials. You can add profile details later.</p>
      <div className="mb-5 grid grid-cols-3 gap-2" aria-label="Choose account type">
        {Object.entries(ROLES).map(([key, label]) => <Link key={key} to={`/register/${key}`} aria-current={role === key ? 'page' : undefined}
          className={`rounded-lg border px-2 py-2 text-center text-sm font-semibold ${role === key ? 'border-brand bg-soft text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {label}
        </Link>)}
      </div>
      {isCollege && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">College accounts are reviewed by the SkillBridge team before dashboard access is enabled.</p>}
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setErr('');
        setBusy(true);
        try {
          const body = isCollege
            ? { role, collegeName: f.collegeName, email: f.email, password: f.password }
            : { role, name: f.name, email: f.email, password: f.password };
          await register(body);
          nav('/app', { replace: true });
        } catch (x) {
          setErr(errMsg(x));
        } finally {
          setBusy(false);
        }
      }}>
        {isCollege
          ? <Field label="College name" autoComplete="organization" required minLength={2} value={f.collegeName} onChange={(e) => setF({ ...f, collegeName: e.target.value })} />
          : <Field label="Full name" autoComplete="name" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
        <Field label={isCollege ? 'Official email' : 'Email'} type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label="Password (at least 8 characters)" type="password" autoComplete="new-password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Err msg={err} />
        <Btn className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Btn>
      </form>
      <p className="mt-5 text-sm text-mute">Already have an account? <Link className="font-semibold text-brand" to="/login">Log in</Link></p>
    </Card>
  </div>;
}
