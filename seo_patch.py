import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

helper = """
    // ==================== SEO / AEO ====================
    function updateMeta(title, description) {
      document.title = title + ' | Italia Cosmetics';
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }
"""

# Insert helper before navigate
content = content.replace("    // ==================== NAVIGATION ====================", helper + "\n    // ==================== NAVIGATION ====================")

# Update navigate
navigate_repl = """    function navigate(page) {
      // SEO Updates for static pages
      const pageTitles = {
        'home': 'Premium Professional Haircare & Skincare',
        'shop': 'Shop Professional Hair Cosmetics',
        'brands': 'Our Brands (Genus, Versum, Maxylook, UNA)',
        'about': 'About Us',
        'blog': 'Beauty Blog & Tips',
        'contact': 'Contact & FAQs',
        'checkout': 'Checkout'
      };
      if (pageTitles[page]) {
        updateMeta(pageTitles[page], 'Discover ' + pageTitles[page] + ' at Italia Cosmetics.');
      }
"""
content = re.sub(r'    function navigate\(page\) \{', navigate_repl, content, count=1)

# Update openProductModal to set SEO for product
product_modal_match = re.search(r'function openProductModal\(product\) \{', content)
if product_modal_match:
    product_repl = """function openProductModal(product) {
      if (product && product.name) {
         updateMeta(product.name, product.description ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 150) : 'Buy ' + product.name);
      }"""
    content = content.replace('function openProductModal(product) {', product_repl, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js SEO tags updated")
