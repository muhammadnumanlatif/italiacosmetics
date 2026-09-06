import { json, readJson } from '../_lib/http.js';

// POST /api/orders -> creates an order + its line items in D1.
// Body shape matches what app.js's submitOrder() has always sent (originally
// built to match the WooCommerce order-creation payload); kept identical so
// the storefront checkout code needs no changes.
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body || !Array.isArray(body.line_items) || !body.line_items.length) {
    return json({ error: 'Missing or empty line_items' }, 400);
  }

  const billing = body.billing || {};
  const shippingTotal = (body.shipping_lines || []).reduce((sum, l) => sum + (parseFloat(l.total) || 0), 0);
  const itemsTotal = body.line_items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const currency = 'PKR';

  try {
    const orderResult = await env.DB.prepare(
      `INSERT INTO orders (status, currency, total, customer_id, billing_first_name, billing_last_name,
       billing_email, billing_phone, billing_address_1, billing_city, billing_state, billing_postcode,
       billing_country, payment_method, payment_method_title, set_paid)
       VALUES ('processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'Cash on Delivery', 0)`
    ).bind(
      currency, itemsTotal + shippingTotal, body.customer_id || null,
      billing.first_name || '', billing.last_name || '', billing.email || '', billing.phone || '',
      billing.address_1 || '', billing.city || '', billing.state || '', billing.postcode || '',
      billing.country || 'PK'
    ).run();

    const orderId = orderResult.meta.last_row_id;

    const inserts = body.line_items.map(item =>
      env.DB.prepare(
        'INSERT INTO order_items (order_id, product_id, name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(orderId, item.product_id, item.name, item.quantity, parseFloat(item.price) || 0, parseFloat(item.total) || 0)
    );
    await env.DB.batch(inserts);

    return json({ id: orderId, status: 'processing', total: itemsTotal + shippingTotal, currency });
  } catch (e) {
    return json({ error: 'Could not place order' }, 500);
  }
}
