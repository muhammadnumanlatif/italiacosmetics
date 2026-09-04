import { wcFetch, json } from '../../_lib/wc.js';

// GET /api/orders/:id?email=... -> order status lookup (mirrors old trackOrder())
//
// The email check happens here, server-side, and only status/total/currency
// are ever returned — never billing name/address/phone. Previously the admin
// key let anyone fetch the full order object directly and read that PII by
// guessing an order id; this endpoint can't leak it even if id is guessed,
// since a wrong email just gets "not found".
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const email = new URL(request.url).searchParams.get('email');
  const id = params.id;

  if (!id || !email) return json({ error: 'Missing order id or email' }, 400);

  try {
    const { ok, data } = await wcFetch(env, '/orders/' + encodeURIComponent(id));
    const billingEmail = data && data.billing && data.billing.email;
    if (!ok || !billingEmail || String(billingEmail).toLowerCase() !== String(email).toLowerCase()) {
      return json({ error: 'Order not found' }, 404);
    }
    return json({ id: data.id, status: data.status, total: data.total, currency: data.currency });
  } catch (e) {
    return json({ error: 'Could not look up order' }, 500);
  }
}
