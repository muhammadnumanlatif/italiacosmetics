import { wcFetch, json } from '../../_lib/wc.js';

// GET /api/products/:id -> single product (mirrors old renderProductDetails() fetch)
export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;
  if (!id) return json({ error: 'Missing product id' }, 400);

  try {
    const { ok, status, data } = await wcFetch(
      env,
      '/products/' + encodeURIComponent(id) +
      '?_fields=id,name,description,price,attributes,images,categories,meta_data,total_sales'
    );
    return json(data, ok ? 200 : status);
  } catch (e) {
    return json({ error: 'Could not reach product catalog' }, 502);
  }
}
