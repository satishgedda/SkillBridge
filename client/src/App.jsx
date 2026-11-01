import { Component, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { PublicLayout, Home, Info, Verify } from './pages/public';
import { Login, Register } from './pages/auth';
import { DashLayout } from './pages/layout';
import * as S from './pages/student';
import * as M from './pages/mentor';
import * as C from './pages/college';
import * as A from './pages/admin';

const routesFor = { student: <>
  <Route index element={<S.Overview />} /><Route path="profile" element={<S.Profile />} /><Route path="drives" element={<S.Drives />} /><Route path="assessments" element={<S.AssessmentsPage />} />
  <Route path="enrollment/:id" element={<S.Enrollment />} /><Route path="test/:id/:order" element={<S.Test />} /><Route path="mentors" element={<S.Mentors />} /><Route path="book/:id/:order" element={<S.Book />} />
  <Route path="bookings" element={<S.Bookings />} /><Route path="mock-interviews" element={<S.MockInterviews />} /><Route path="reports" element={<S.Report />} /><Route path="improvement" element={<S.Report improve />} />
  <Route path="certificates" element={<S.Certificates />} /><Route path="certificate/:certId" element={<S.CertificateView />} /><Route path="payments" element={<S.Payments />} /><Route path="settings" element={<S.Settings />} /></>,
  mentor: <><Route index element={<M.Overview />} /><Route path="profile" element={<M.Profile />} /><Route path="availability" element={<M.Slots />} /><Route path="bookings" element={<M.Bookings />} /></>,
  college: <><Route index element={<C.Overview />} /><Route path="students" element={<C.Students />} /><Route path="analytics" element={<C.Analytics />} /></>,
  admin: <><Route index element={<A.Overview />} /><Route path="users" element={<A.Users />} /><Route path="mentors" element={<A.Mentors />} /><Route path="colleges" element={<A.Colleges />} />
    <Route path="drives" element={<A.Drives />} /><Route path="questions" element={<A.Questions />} /><Route path="records" element={<A.Records />} /><Route path="settings" element={<A.Settings />} /></>,
};
class DashboardErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Dashboard rendering failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-2 text-2xl font-bold text-navy">Dashboard could not be displayed</h1>
        <p className="mb-4 text-mute">An unexpected page error occurred. Reload the dashboard or return to the home page.</p>
        <button className="mr-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Reload dashboard</button>
        <Link className="text-brand underline" to="/">Go to home</Link>
      </main>;
    }
    return this.props.children;
  }
}

function Private() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  if (user === undefined) return <p className="p-8" role="status">Loading your account…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!Object.hasOwn(routesFor, user.role)) {
    return <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-2 text-2xl font-bold text-navy">Dashboard unavailable</h1>
      <p className="mb-4 text-mute">Your account is missing a supported role. Please sign out and contact SkillBridge support.</p>
      {logoutError && <p className="mb-3 text-sm text-red-700" role="alert">{logoutError}</p>}
      <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={async () => {
        try {
          await logout();
          navigate('/login', { replace: true });
        } catch (error) {
          console.error('Could not sign out from the invalid-role recovery screen:', error);
          setLogoutError('Could not sign out. Please reload the page and try again.');
        }
      }}>Sign out</button>
    </main>;
  }
  return <DashboardErrorBoundary>
    <Routes><Route element={<DashLayout />}>{routesFor[user.role]}<Route path="*" element={<Navigate to="/app" replace />} /></Route></Routes>
  </DashboardErrorBoundary>;
}
export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}><Route index element={<Home />} />
      {['about', 'how-it-works', 'services', 'pricing', 'colleges', 'mentors', 'certification', 'contact', 'privacy', 'terms'].map((s) => <Route key={s} path={s} element={<Info slug={s} />} />)}
      <Route path="login" element={<Login />} /><Route path="register/:role" element={<Register />} /><Route path="verify/:id" element={<Verify />} /></Route>
    <Route path="/app/*" element={<Private />} /><Route path="*" element={<Navigate to="/" />} />
  </Routes>;
}
