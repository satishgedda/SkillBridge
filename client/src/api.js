import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true });
export const errMsg = (e) => e?.response?.data?.error || e?.message || 'Something went wrong';
export const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); // always shown in the viewer's own time zone
