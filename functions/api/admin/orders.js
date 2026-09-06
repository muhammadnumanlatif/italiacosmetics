import { withAdmin, json } from '../../_lib/http.js';

// GET /api/admin/orders?status=processing -> list, most recent first
export const onRequestGet = withAdmin(async ({ request, env }) => {
  const status = new URL(request.url).searchParams.get('status');

  const query = status
    ? env.DB.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').bind(status)
    : env.DB.prepare('SELECT * FROM orders ORDER BY id DESC');

  const { results: orders } = await query.all();
  if (!orders.length) return json([]);

  const ids = orders.map(o => o.id);
  const placeholders = ids.map(() => '?').join(',');
  const { results: items } = await env.DB.prepare(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`
  ).bind(...ids).all();

  const itemsByOrder = {};
  for (const item of items) {
    (itemsByOrder[item.order_id] ||= []).push(item);
  }

  return json(orders.map(o => ({ ...o, items: itemsByOrder[o.id] || [] })));
});
