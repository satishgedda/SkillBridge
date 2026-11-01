import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
const Ctx = createContext(null); export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => { api.get('/auth/me').then((r) => setUser(r.data)).catch(() => setUser(null)); }, []);
  const login = async (email, password) => setUser((await api.post('/auth/login', { email, password })).data);
  const register = async (body) => setUser((await api.post('/auth/register', body)).data);
  const logout = async () => { await api.post('/auth/logout'); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, login, register, logout }}>{children}</Ctx.Provider>;
}
