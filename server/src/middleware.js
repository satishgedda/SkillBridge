import jwt from 'jsonwebtoken';
import { User } from './models.js';
const prod = process.env.NODE_ENV === 'production';
export const sign = (u, res) => res.cookie('token', jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax', maxAge: 7 * 864e5 });
export const guard = (...roles) => async (req, res, next) => {
  try {
    const t = req.cookies?.token; if (!t) return res.status(401).json({ error: 'Please log in' });
    const u = await User.findById(jwt.verify(t, process.env.JWT_SECRET).id);
    if (!u) return res.status(401).json({ error: 'Account not found' });
    if (roles.length && !roles.includes(u.role)) return res.status(403).json({ error: 'You do not have access to this resource' });
    req.user = u; next();
  } catch { res.status(401).json({ error: 'Session expired. Please log in again' }); }
};
