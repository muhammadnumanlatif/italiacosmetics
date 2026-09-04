import { wcFetch, json } from '../_lib/wc.js';

// GET /api/products            -> full paginated product list (mirrors old fetchProducts())
// GET /api/products?search=xyz -> product search (mirrors old doSearch())
export async function onRequestGet(context) {
  const { request, env } = context;
  const search = new URL(request.url).searchParams.get('search');

  try {
    if (search) {
      const { ok, status, data } = await wcFetch(
        env,
        '/products?search=' + encodeURIComponent(search) +
        '&per_page=10&_fields=id,name,price,attributes,images,meta_data'
      );
      return json(data, ok ? 200 : status);
    }

    let all = [];
    let page = 1;
    let fetched;
    do {
      const { ok, data } = await wcFetch(
        env,
        '/products?per_page=100&page=' + page +
        '&_fields=id,name,description,price,attributes,images,categories,meta_data,total_sales'
      );
      if (!ok) throw new Error('WC upstream error');
      fetched = Array.isArray(data) ? data : [];
      if (fetched.length) all = all.concat(fetched);
      page++;
    } while (fetched.length === 100);

    return json(all);
  } catch (e) {
    return json({ error: 'Could not reach product catalog' }, 500);
  }
}
