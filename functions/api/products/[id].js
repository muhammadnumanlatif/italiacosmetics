import { json } from '../../_lib/http.js';

export async function onRequestGet({ env, params }) {
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();
  if (!row) return json({ error: 'Product not found' }, 404);
  return json({
    id: row.id, brand: row.brand, name: row.name, line: row.line, desc: row.description,
    price: row.price, currency: row.currency, cat: row.cat, badge: row.badge,
    rating: row.rating, img: row.img, origPrice: row.orig_price, total_sales: row.total_sales
  });
}
