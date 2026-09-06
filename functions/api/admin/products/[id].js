import { withAdmin, json, readJson } from '../../../_lib/http.js';

export const onRequestPut = withAdmin(async ({ request, env, params }) => {
  const p = await readJson(request);
  if (!p) return json({ error: 'Missing body' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(params.id).first();
  if (!existing) return json({ error: 'Product not found' }, 404);

  await env.DB.prepare(
    `UPDATE products SET brand=?, name=?, line=?, description=?, price=?, orig_price=?,
     currency=?, cat=?, badge=?, rating=?, img=?, updated_at=datetime('now') WHERE id=?`
  ).bind(
    p.brand || 'Italia Cosmetics', p.name, p.line || '', p.description || '',
    Number(p.price) || 0, p.orig_price != null ? Number(p.orig_price) : null,
    p.currency || 'PKR', p.cat || 'Product', p.badge || '', Number(p.rating) || 5,
    p.img || '', params.id
  ).run();

  const updated = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(params.id).first();
  return json(updated);
});

export const onRequestDelete = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Product not found' }, 404);
  return json({ ok: true });
});
