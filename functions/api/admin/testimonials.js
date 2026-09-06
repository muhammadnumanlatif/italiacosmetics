import { withAdmin, json, readJson } from '../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM testimonials ORDER BY id').all();
  return json(results);
});

export const onRequestPost = withAdmin(async ({ request, env }) => {
  const t = await readJson(request);
  if (!t || !t.name || !t.text) return json({ error: 'Missing name or text' }, 400);

  const result = await env.DB.prepare(
    'INSERT INTO testimonials (name, role, text, rating, avatar) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    t.name, t.role || '', t.text, Number(t.rating) || 5, t.avatar || t.name.charAt(0).toUpperCase()
  ).run();

  const created = await env.DB.prepare('SELECT * FROM testimonials WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return json(created, 201);
});
