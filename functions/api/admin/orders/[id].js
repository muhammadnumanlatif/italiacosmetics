import { withAdmin, json, readJson } from '../../../_lib/http.js';

const VALID_STATUSES = ['processing', 'completed', 'cancelled', 'refunded', 'on-hold'];

export const onRequestGet = withAdmin(async ({ env, params }) => {
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(params.id).first();
  if (!order) return json({ error: 'Order not found' }, 404);
  const { results: items } = await env.DB.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind(params.id).all();
  return json({ ...order, items });
});

// PATCH /api/admin/orders/:id { status } -> update order status only
export const onRequestPatch = withAdmin(async ({ request, env, params }) => {
  const body = await readJson(request);
  const status = body && body.status;
  if (!status || !VALID_STATUSES.includes(status)) {
    return json({ error: 'Invalid status. Must be one of: ' + VALID_STATUSES.join(', ') }, 400);
  }

  const result = await env.DB.prepare(
    "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, params.id).run();

  if (!result.meta.changes) return json({ error: 'Order not found' }, 404);
  const updated = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(params.id).first();
  return json(updated);
});
