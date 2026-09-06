import { json } from '../_lib/http.js';

// GET /api/blog -> all posts, newest first (replaces the WP /wp-json/wp/v2/posts fetch)
export async function onRequestGet({ env }) {
  // Sorted by id, not the `date` column -- date is a free-text display string
  // ("Aug 24, 2026"), not ISO, so it doesn't sort chronologically as text.
  const { results } = await env.DB.prepare(
    'SELECT * FROM blog_posts ORDER BY id DESC'
  ).all();
  return json(results);
}
