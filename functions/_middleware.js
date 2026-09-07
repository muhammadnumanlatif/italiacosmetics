// Every route in this SPA (/, /shop, /product-149, /post-3, ...) is served
// the exact same static index.html by Cloudflare Pages' SPA fallback -- the
// per-page <link id="canonicalLink"> only gets corrected client-side, after
// app.js runs. Crawlers and tools that read the raw HTML (i.e. before JS
// executes) saw a canonical of "https://italiacosmetics.com/" on every single
// page, which tells search engines the whole catalog is a duplicate of the
// homepage. This rewrites the tag server-side so the raw response is already
// correct.
const SITE_URL = 'https://italiacosmetics.com';

// Mirrors pageUrlPath()/getPageFromUrl() in app.js so the server-rendered
// canonical always agrees with the one app.js sets after hydration.
function canonicalPath(url) {
  const params = url.searchParams;
  if (params.has('page')) {
    const page = params.get('page') || 'home';
    const id = params.get('id');
    if (page === 'product-details' && id) return '/product-' + id;
    if (page === 'single-blog' && id) return '/post-' + id;
    if (page === 'home') return '/';
    return '/' + page;
  }

  let path = url.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

export async function onRequest(context) {
  const response = await context.next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const canonicalUrl = SITE_URL + canonicalPath(new URL(context.request.url));

  return new HTMLRewriter()
    .on('link#canonicalLink', {
      element(el) {
        el.setAttribute('href', canonicalUrl);
      }
    })
    .transform(response);
}
