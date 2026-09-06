import { hashPassword } from '../_lib/auth.js';
import { json, readJson } from '../_lib/http.js';

// POST /api/customers -> register a storefront customer account
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const email = body && String(body.email || '').trim().toLowerCase();
  const password = body && body.password;
  if (!email || !password) return json({ error: 'Missing email or password' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email).first();
  if (existing) return json({ error: 'An account with this email already exists' }, 409);

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    'INSERT INTO customers (email, username, password_hash) VALUES (?, ?, ?)'
  ).bind(email, email, passwordHash).run();

  return json({ id: result.meta.last_row_id, email }, 201);
}
