import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
html = re.sub(r'href="#([a-zA-Z0-9_-]+)"', r'href="/\1"', html)
# Except for some specific links if any, but all internal links should be safe to map to /path.
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html updated")

# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Replace active link selector
app_js = app_js.replace(r'''document.querySelectorAll('.nav a[href="#' + page + '"], .mobile-nav a[href="#' + page + '"]').forEach''', 
                        r'''document.querySelectorAll('.nav a[href="/' + page + '"], .mobile-nav a[href="/' + page + '"]').forEach''')

# Replace history.pushState
app_js = app_js.replace(r"if (location.hash !== '#' + page) history.pushState(null, '', '#' + page);",
                        r"if (location.pathname !== '/' + page && page !== 'home') history.pushState(null, '', '/' + page); else if (location.pathname !== '/' && page === 'home') history.pushState(null, '', '/');")

# Replace hashchange with popstate
# We need to rewrite the hashchange and init logic
router_logic = """
    // ==================== ROUTER ====================
    window.addEventListener('popstate', () => {
      const page = location.pathname.replace('/', '') || 'home';
      if (document.getElementById('page-' + page)) navigate(page);
    });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/')) {
        const page = a.getAttribute('href').replace('/', '') || 'home';
        if (document.getElementById('page-' + page)) {
          e.preventDefault();
          navigate(page);
        }
      }
    });

    // Initial navigation based on pathname instead of hash
    const initialPage = location.pathname.replace('/', '') || 'home';
    if (document.getElementById('page-' + initialPage)) {
      navigate(initialPage);
    } else {
      navigate('home');
    }
"""

# Find the old hashchange block and replace it
# The old block looks like:
# window.addEventListener('hashchange', () => { ...
# ...
# if (location.hash) { ...
#   navigate(page);
# } else {
#   navigate('home');
# }

app_js = re.sub(r"window\.addEventListener\('hashchange'.*?navigate\('home'\);\s*\}", router_logic, app_js, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
print("app.js updated")

# 3. Update generate_seo_files.py
with open('generate_seo_files.py', 'r', encoding='utf-8') as f:
    seo_py = f.read()

seo_py = seo_py.replace('f"{base_url}/#home"', 'f"{base_url}/"')
seo_py = seo_py.replace('f"{base_url}/#shop"', 'f"{base_url}/shop"')
seo_py = seo_py.replace('f"{base_url}/#brands"', 'f"{base_url}/brands"')
seo_py = seo_py.replace('f"{base_url}/#about"', 'f"{base_url}/about"')
seo_py = seo_py.replace('f"{base_url}/#blog"', 'f"{base_url}/blog"')
seo_py = seo_py.replace('f"{base_url}/#contact"', 'f"{base_url}/contact"')
seo_py = seo_py.replace('f"{base_url}/#product-{p[\'id\']}"', 'f"{base_url}/product-{p[\'id\']}"')
seo_py = seo_py.replace('f"{base_url}/#{page[\'slug\']}"', 'f"{base_url}/{page[\'slug\']}"')
seo_py = seo_py.replace('f"{base_url}/#post-{post[\'id\']}"', 'f"{base_url}/post-{post[\'id\']}"')

with open('generate_seo_files.py', 'w', encoding='utf-8') as f:
    f.write(seo_py)
print("generate_seo_files.py updated")

