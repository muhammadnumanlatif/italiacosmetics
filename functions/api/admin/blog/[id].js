import { withAdmin, json, readJson } from '../../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env, params }) => {
  const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(params.id).first();
  if (!post) return json({ error: 'Post not found' }, 404);
  return json(post);
});

export const onRequestPut = withAdmin(async ({ request, env, params }) => {
  const b = await readJson(request);
  if (!b || !b.title || !b.content) return json({ error: 'Missing title or content' }, 400);

  const result = await env.DB.prepare(
    `UPDATE blog_posts SET title=?, date=?, author=?, cat=?, excerpt=?, gradient=?, icon=?,
     content=?, updated_at=datetime('now') WHERE id=?`
  ).bind(
    b.title, b.date || '', b.author || 'Italia Editorial Board', b.cat || 'Shampoo',
    b.excerpt || '', b.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)',
    b.icon || 'fa-star', b.content, params.id
  ).run();

  if (!result.meta.changes) return json({ error: 'Post not found' }, 404);
  const updated = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(params.id).first();
  return json(updated);
});

export const onRequestDelete = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Post not found' }, 404);
  return json({ ok: true });
});
