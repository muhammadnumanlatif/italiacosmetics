import { withAdmin, json, readJson } from '../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, title, date, author, cat, excerpt, gradient, icon, img FROM blog_posts ORDER BY id DESC'
  ).all();
  return json(results);
});

export const onRequestPost = withAdmin(async ({ request, env }) => {
  const b = await readJson(request);
  if (!b || !b.title || !b.content) return json({ error: 'Missing title or content' }, 400);

  // Blog IDs are picked by the author (matches the existing 1/101/201/301-style
  // numbering already used across the 40 seeded posts) rather than autoincrement,
  // so new posts can be grouped into the same numbering scheme.
  const id = Number(b.id);
  if (!id) return json({ error: 'Missing numeric id' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM blog_posts WHERE id = ?').bind(id).first();
  if (existing) return json({ error: 'A post with this id already exists' }, 409);

  await env.DB.prepare(
    `INSERT INTO blog_posts (id, title, date, author, cat, excerpt, gradient, icon, img, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, b.title, b.date || new Date().toISOString().slice(0, 10), b.author || 'Italia Editorial Board',
    b.cat || 'Shampoo', b.excerpt || '', b.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)',
    b.icon || 'fa-star', b.img || '', b.content
  ).run();

  const created = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
  return json(created, 201);
});
