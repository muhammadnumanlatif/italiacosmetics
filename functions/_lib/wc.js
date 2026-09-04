// Server-side only (runs in the Cloudflare Pages Function, never shipped to
// the browser). Holds the WooCommerce Application Password. Configure via
// Cloudflare Pages > Settings > Environment variables (or `wrangler pages
// secret put`):
//   WC_BASE_URL      e.g. https://api.italiacosmetics.com/wp-json/wc/v3
//   WC_APP_USER      WordPress username (an account scoped to products/orders only)
//   WC_APP_PASSWORD  Application Password generated in WP Admin > Users > Profile

export async function wcFetch(env, path, options = {}) {
  const base = env.WC_BASE_URL || 'https://api.italiacosmetics.com/wp-json/wc/v3';
  const user = env.WC_APP_USER;
  const pass = env.WC_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('WC_APP_USER / WC_APP_PASSWORD are not configured in the environment');
  }
  const auth = 'Basic ' + btoa(user + ':' + pass);

  const res = await fetch(base + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
