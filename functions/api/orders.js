import { wcFetch, json } from '../_lib/wc.js';

// POST /api/orders -> create a WooCommerce order (mirrors old submitOrder())
export async function onRequestPost(context) {
  const { request, env } = context;

  let orderData;
  try { orderData = await request.json(); } catch (e) { orderData = null; }

  if (!orderData || !Array.isArray(orderData.line_items) || !orderData.line_items.length) {
    return json({ error: 'Missing or empty line_items' }, 400);
  }

  try {
    // Force these server-side so the client can't set order state directly.
    const safeOrderData = {
      ...orderData,
      payment_method: 'cod',
      payment_method_title: 'Cash on Delivery',
      set_paid: false,
      status: 'processing'
    };

    const { ok, status, data } = await wcFetch(env, '/orders', {
      method: 'POST',
      body: JSON.stringify(safeOrderData)
    });
    return json(data, ok ? 200 : status);
  } catch (e) {
    return json({ error: 'Could not place order' }, 500);
  }
}
