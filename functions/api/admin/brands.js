import { withAdmin, json, readJson } from '../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM brands ORDER BY id').all();
  return json(results);
});

export const onRequestPost = withAdmin(async ({ request, env }) => {
  const b = await readJson(request);
  if (!b || !b.name) return json({ error: 'Missing brand name' }, 400);

  const result = await env.DB.prepare(
    'INSERT INTO brands (css_id, name, gradient, description, text_color, img) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    b.css_id || '', b.name, b.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)',
    b.description || '', b.text_color || '#fff', b.img || ''
  ).run();

  const created = await env.DB.prepare('SELECT * FROM brands WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return json(created, 201);
});
