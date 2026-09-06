import { withAdmin, json, readJson } from '../../../_lib/http.js';

export const onRequestPut = withAdmin(async ({ request, env, params }) => {
  const b = await readJson(request);
  if (!b || !b.name) return json({ error: 'Missing brand name' }, 400);

  const result = await env.DB.prepare(
    'UPDATE brands SET css_id=?, name=?, gradient=?, description=?, text_color=?, img=? WHERE id=?'
  ).bind(
    b.css_id || '', b.name, b.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)',
    b.description || '', b.text_color || '#fff', b.img || '', params.id
  ).run();

  if (!result.meta.changes) return json({ error: 'Brand not found' }, 404);
  const updated = await env.DB.prepare('SELECT * FROM brands WHERE id = ?').bind(params.id).first();
  return json(updated);
});

export const onRequestDelete = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare('DELETE FROM brands WHERE id = ?').bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Brand not found' }, 404);
  return json({ ok: true });
});
