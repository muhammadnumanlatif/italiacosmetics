import { verifyPassword, createSession, sessionCookie } from '../../_lib/auth.js';
import { json, readJson } from '../../_lib/http.js';

// POST /api/admin/login { email, password } -> sets admin_session cookie
export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await readJson(request);
  const email = body && String(body.email || '').trim().toLowerCase();
  const password = body && body.password;

  if (!email || !password) return json({ error: 'Missing email or password' }, 400);

  const admin = await env.DB.prepare(
    'SELECT id, email, password_hash FROM admin_users WHERE email = ?'
  ).bind(email).first();

  // Always run verifyPassword, even on a missing user, against a dummy hash
  // of the same format -- avoids leaking "user exists" via response timing.
  const dummyHash = 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const ok = await verifyPassword(password, admin ? admin.password_hash : dummyHash);

  if (!admin || !ok) return json({ error: 'Invalid email or password' }, 401);

  const { token, expiresAt } = await createSession(env, admin.id);
  context.waitUntil(
    env.DB.prepare('UPDATE admin_users SET last_login_at = datetime(\'now\') WHERE id = ?')
      .bind(admin.id).run()
  );

  return json({ email: admin.email }, 200, { 'Set-Cookie': sessionCookie(token, expiresAt, request) });
}
