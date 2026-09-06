import { json } from '../../_lib/http.js';

// GET /api/orders/:id?email=... -- order status lookup, matching the original
// contract: only status/total/currency are ever returned, never billing PII,
// and a wrong email just looks identical to a wrong id (no existence leak).
export async function onRequestGet({ request, env, params }) {
  const email = new URL(request.url).searchParams.get('email');
  if (!params.id || !email) return json({ error: 'Missing order id or email' }, 400);

  const order = await env.DB.prepare(
    'SELECT id, status, total, currency, billing_email FROM orders WHERE id = ?'
  ).bind(params.id).first();

  if (!order || String(order.billing_email).toLowerCase() !== String(email).toLowerCase()) {
    return json({ error: 'Order not found' }, 404);
  }

  return json({ id: order.id, status: order.status, total: order.total, currency: order.currency });
}
