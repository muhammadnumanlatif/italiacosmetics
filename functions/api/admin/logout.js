import { clearSessionCookie } from '../../_lib/auth.js';
import { json } from '../../_lib/http.js';

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

// POST /api/admin/logout -> deletes the current session and clears the cookie
export async function onRequestPost(context) {
  const { request, env } = context;
  const token = parseCookies(request.headers.get('Cookie'))['admin_session'];
  if (token) {
    context.waitUntil(env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run());
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}
