import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, LogOut, LayoutDashboard, User, Briefcase, ClipboardCheck, Video, CalendarCheck, BarChart3, TrendingUp, Award, CreditCard, Settings, Users, ShieldCheck, Building2, FileQuestion, Database, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../auth';
import { errMsg } from '../api';
import { Err } from '../ui';
const N = {
  student: [
    ['', 'Dashboard', LayoutDashboard],
    ['profile', 'My Profile', User],
    ['drives', 'Placement Drives', Briefcase],
    ['assessments', 'Assessments', ClipboardCheck],
    ['mentors', 'Mentor Profiles', Video],
    ['mock-interviews', 'Mock Interviews', MessageSquare],
    ['bookings', 'Interview Bookings', CalendarCheck],
    ['reports', 'Performance Reports', BarChart3],
    ['improvement', 'Skill Improvement', TrendingUp],
    ['certificates', 'Certificates', Award],
    ['payments', 'Payments', CreditCard],
    ['settings', 'Settings', Settings],
  ],
  mentor: [['', 'Dashboard', LayoutDashboard], ['profile', 'Profile', User], ['availability', 'Availability', Clock], ['bookings', 'Interviews', CalendarCheck]],
  college: [['', 'Dashboard', LayoutDashboard], ['students', 'Students', Users], ['analytics', 'Analytics', BarChart3]],
  admin: [['', 'Overview', LayoutDashboard], ['users', 'Users', Users], ['mentors', 'Mentor Verification', ShieldCheck], ['colleges', 'Colleges', Building2], ['drives', 'Placement Drives', Briefcase], ['questions', 'Assessments', FileQuestion], ['records', 'Interviews & Payments', Database], ['settings', 'Settings', Settings]],
};
export function DashLayout() {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false); const [logoutError, setLogoutError] = useState('');
  const signOut = async () => {
    try {
      setLogoutError('');
      await logout();
      nav('/', { replace: true });
    } catch (error) {
      console.error('Could not sign out:', error);
      setLogoutError(errMsg(error));
    }
  };
  return <div className="min-h-screen md:flex">
    <aside className={`${open ? 'block' : 'hidden'} print:hidden md:block md:w-64 shrink-0 bg-navy p-4 text-white`}>
      <div className="mb-6 font-display text-xl font-extrabold">Skill<span className="text-blue-300">Bridge</span></div>
      <nav className="space-y-1">{N[user.role].map(([to, label, Icon]) => <NavLink key={to} to={`/app/${to}`} end onClick={() => setOpen(false)}
        className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand' : 'hover:bg-white/10'}`}><Icon size={18} />{label}</NavLink>)}
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10"><LogOut size={18} />Logout</button></nav>
    </aside>
    <div className="flex-1"><header className="flex items-center gap-3 border-b bg-white px-4 py-3 print:hidden"><button className="md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Menu /></button>
      <span className="ml-auto text-right text-sm text-mute">{user.name} · {user.role}{user.isSample && <span className="ml-2 font-semibold text-brand">Demo data</span>}</span></header>
      {logoutError && <div className="mx-auto mt-4 max-w-5xl px-4 md:px-8"><Err msg={`Could not log out: ${logoutError}`} /></div>}
      <main className="mx-auto max-w-5xl p-4 md:p-8"><Outlet /></main></div></div>;
}
