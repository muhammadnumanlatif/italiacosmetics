import { json } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT * FROM brands ORDER BY id').all();
  return json(results.map(b => ({
    id: b.css_id || String(b.id),
    name: b.name,
    gradient: b.gradient,
    desc: b.description,
    textColor: b.text_color,
    img: b.img
  })));
}
