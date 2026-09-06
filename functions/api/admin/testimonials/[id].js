import { withAdmin, json, readJson } from '../../../_lib/http.js';

export const onRequestPut = withAdmin(async ({ request, env, params }) => {
  const t = await readJson(request);
  if (!t || !t.name || !t.text) return json({ error: 'Missing name or text' }, 400);

  const result = await env.DB.prepare(
    'UPDATE testimonials SET name=?, role=?, text=?, rating=?, avatar=? WHERE id=?'
  ).bind(
    t.name, t.role || '', t.text, Number(t.rating) || 5,
    t.avatar || t.name.charAt(0).toUpperCase(), params.id
  ).run();

  if (!result.meta.changes) return json({ error: 'Testimonial not found' }, 404);
  const updated = await env.DB.prepare('SELECT * FROM testimonials WHERE id = ?').bind(params.id).first();
  return json(updated);
});

export const onRequestDelete = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare('DELETE FROM testimonials WHERE id = ?').bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Testimonial not found' }, 404);
  return json({ ok: true });
});
