import { withAdmin, json, readJson } from '../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM products ORDER BY id DESC'
  ).all();
  return json(results);
});

export const onRequestPost = withAdmin(async ({ request, env }) => {
  const p = await readJson(request);
  if (!p || !p.name) return json({ error: 'Missing product name' }, 400);

  const result = await env.DB.prepare(
    `INSERT INTO products (brand, name, line, description, price, orig_price, currency, cat, badge, rating, img)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    p.brand || 'Italia Cosmetics', p.name, p.line || '', p.description || '',
    Number(p.price) || 0, p.orig_price != null ? Number(p.orig_price) : null,
    p.currency || 'PKR', p.cat || 'Product', p.badge || '', Number(p.rating) || 5, p.img || ''
  ).run();

  const created = await env.DB.prepare('SELECT * FROM products WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return json(created, 201);
});
