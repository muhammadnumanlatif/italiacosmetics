import urllib.request
import json
import base64
from datetime import datetime

WP_URL = 'http://italiacosmeticscom.local'
AUTH = b'admin:FFl6gVpEvIWyT3Lg8Au0ebfd'
B64_AUTH = base64.b64encode(AUTH).decode('utf-8')
HEADERS = {'Authorization': f'Basic {B64_AUTH}'}

def fetch_json(endpoint):
    url = f"{WP_URL}{endpoint}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

print("Fetching products...")
products = fetch_json('/wp-json/wc/v3/products?per_page=100')
print("Fetching pages...")
pages = fetch_json('/wp-json/wp/v2/pages?per_page=100')
print("Fetching posts...")
posts = fetch_json('/wp-json/wp/v2/posts?per_page=100')

# Generate sitemap.xml
print("Generating sitemap.xml...")
now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
base_url = "https://italiacosmetics.com"

urls = [
    f"{base_url}/",
    f"{base_url}/",
    f"{base_url}/shop",
    f"{base_url}/brands",
    f"{base_url}/about",
    f"{base_url}/blog",
    f"{base_url}/contact"
]

for p in products:
    urls.append(f"{base_url}/product-{p['id']}")
    
for page in pages:
    urls.append(f"{base_url}/{page['slug']}")

for post in posts:
    urls.append(f"{base_url}/post-{post['id']}")

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in set(urls):
        f.write('  <url>\n')
        f.write(f'    <loc>{u}</loc>\n')
        f.write(f'    <lastmod>{now}</lastmod>\n')
        f.write('    <changefreq>daily</changefreq>\n')
        f.write('  </url>\n')
    f.write('</urlset>\n')

# Generate llms.txt
print("Generating llms.txt...")
with open('llms.txt', 'w', encoding='utf-8') as f:
    f.write("# Italia Cosmetics - AI Context\n\n")
    f.write("Welcome to the LLM index for Italia Cosmetics. We are a premium beauty supplier specializing in Genus, Versum, Maxylook, and UNA.\n\n")
    
    f.write("## Products\n")
    for p in products:
        name = p.get('name', '')
        price = p.get('price', '')
        desc = p.get('description', '').replace('\n', ' ').replace('<p>', '').replace('</p>', '').strip()
        cat = ", ".join([c['name'] for c in p.get('categories', [])])
        f.write(f"- **{name}** (Category: {cat}) - PKR {price}\n  {desc}\n  URL: {base_url}/#product-{p['id']}\n\n")

    f.write("## Pages\n")
    for page in pages:
        f.write(f"- **{page.get('title', {}).get('rendered', '')}**\n  URL: {base_url}/#{page['slug']}\n\n")
        
    f.write("## Blog Posts\n")
    for post in posts:
        f.write(f"- **{post.get('title', {}).get('rendered', '')}**\n  URL: {base_url}/#post-{post['id']}\n\n")

print("Done!")
