import { json } from '../_lib/http.js';

function toClientShape(row) {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    line: row.line,
    desc: row.description,
    price: row.price,
    currency: row.currency,
    cat: row.cat,
    badge: row.badge,
    rating: row.rating,
    img: row.img,
    origPrice: row.orig_price,
    total_sales: row.total_sales
  };
}

// GET /api/products            -> full product list
// GET /api/products?search=xyz -> name search
export async function onRequestGet({ request, env }) {
  const search = new URL(request.url).searchParams.get('search');

  const query = search
    ? env.DB.prepare('SELECT * FROM products WHERE name LIKE ? ORDER BY id').bind('%' + search + '%')
    : env.DB.prepare('SELECT * FROM products ORDER BY id');

  const { results } = await query.all();
  return json(results.map(toClientShape));
}
