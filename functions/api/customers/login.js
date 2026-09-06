import { verifyPassword, generateSessionToken } from '../../_lib/auth.js';
import { json, readJson } from '../../_lib/http.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days -- storefront login is low-stakes (order history/prefill only)

// POST /api/customers/login -> { id, email, name, token }
// `token` is a bearer token the client stores in localStorage (matches the
// original WP JWT-login shape app.js already expects), not a cookie -- the
// storefront account is a convenience feature, not the security boundary
// (order lookups are still gated by matching billing email server-side).
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const email = body && String(body.email || '').trim().toLowerCase();
  const password = body && body.password;
  if (!email || !password) return json({ error: 'Missing email or password' }, 400);

  const customer = await env.DB.prepare(
    'SELECT id, email, username, password_hash FROM customers WHERE email = ?'
  ).bind(email).first();

  const dummyHash = 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const ok = await verifyPassword(password, customer ? customer.password_hash : dummyHash);
  if (!customer || !ok) return json({ message: 'Invalid credentials' }, 401);

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await env.DB.prepare(
    'INSERT INTO customer_sessions (token, customer_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, customer.id, expiresAt).run();

  return json({ id: customer.id, email: customer.email, name: customer.username, token });
}
