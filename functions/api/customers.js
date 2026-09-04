import { wcFetch, json } from '../_lib/wc.js';

// POST /api/customers -> register a WooCommerce customer (mirrors old registerCustomer())
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch (e) { body = null; }
  const email = body && body.email;
  const password = body && body.password;

  if (!email || !password) return json({ error: 'Missing email or password' }, 400);

  try {
    const { ok, status, data } = await wcFetch(env, '/customers', {
      method: 'POST',
      body: JSON.stringify({ email, password, username: email })
    });
    return json(data, ok ? 200 : status);
  } catch (e) {
    return json({ error: 'Could not create account' }, 500);
  }
}
