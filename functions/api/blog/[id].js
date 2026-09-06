import { json } from '../../_lib/http.js';

export async function onRequestGet({ env, params }) {
  const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(params.id).first();
  if (!post) return json({ error: 'Post not found' }, 404);
  return json(post);
}
