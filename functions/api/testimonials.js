import { json } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT * FROM testimonials ORDER BY id').all();
  return json(results);
}
