# Headless WordPress Adaptation Plan

## Goal
Add **headless WordPress integration** to the existing Italia Cosmetics static site (`index.html`) so it pulls products, content, and forms from `http://italiacosmeticscom.local/`. Design system reference: `DESIGN.md`.

---

## 1. Add WordPress `WP` Config Object

Insert at the top of the `<script>` block (end of `<body>`). No existing WP config exists — must be added from scratch:

```js
const WP = {
  url: 'http://italiacosmeticscom.local',
  rest: 'http://italiacosmeticscom.local/wp-json/wp/v2',
  wc: 'http://italiacosmeticscom.local/wp-json/wc/v3',
  acf: 'http://italiacosmeticscom.local/wp-json/acf/v3',
  graphql: 'http://italiacosmeticscom.local/graphql',
  cf7: 'http://italiacosmeticscom.local/wp-json/contact-form-7/v1/contact-forms'
};
```

Also add utility functions: `wpFetch()`, `wpPost()`, `formatPrice()`.

---

## 2. Add Fallback Product Data

The site has no fallback data. Add a `fallbackProducts` array (~12 products) using real product data from `DESIGN.md` lines 593–620 (Maxylook, Genus, Versum, UNA). Structure:

```js
{
  id: 1,
  brand: 'Maxylook',
  name: 'Protecting Shampoo',
  line: 'Collagen',
  price: 24.90,
  size: '250ml',
  category: 'Shampoo',
  image: '...',
  badge: 'Best Seller',
  rating: 5
}
```

---

## 3. Add WooCommerce `fetchProducts()` Function

The site has no REST API calls. Add a function to fetch from `WP.wc + '/products?per_page=20'` and map WooCommerce product attributes to cosmetics fields:

| WooCommerce Attribute | Cosmetics Field |
|---|---|
| `attributes.brand` | `brand` |
| `name` | `name` |
| `attributes.line` | `line` |
| `price` | `price` |
| `attributes.size` | `size` |
| `categories` | `category` |

Fall back to `fallbackProducts` if the API is unreachable.

---

## 4. Add Page Navigation System

The site uses `<div>` sections but has no SPA navigation. Add:
- `data-page` attributes to all nav links
- `navigateTo(pageId)` function to show/hide pages
- URL hash tracking (`window.location.hash`)
- Active state toggling on nav links
- Mobile hamburger menu toggle

---

## 5. Add Client-Side Routing

Map pages by `data-page`:

| `data-page` | Section ID in index.html |
|---|---|
| `home` | `#page-home` |
| `shop` | `#page-shop` |
| `brands` | `#page-brands` |
| `about` | `#page-about` |
| `contact` | `#page-contact` |
| `blog` | `#page-blog` |

---

## 6. Add Contact Form 7 Integration

Replace the existing static contact form (`contact-form` at line ~2415) with a JS-submitted form that posts to CF7 REST API. Add hidden `_wpcf7_unit_tag` field and success/error messaging.

Create 2 CF7 forms in WordPress: **Contact** and **Newsletter**.

---

## 7. Add Announcement Bar

Per `DESIGN.md` `announcement-bar`: purple background (`"#8B5FBF"
`), White text (`#FFFFFF`), height 40px. Insert before `<header>`. Content: *"Free shipping on orders over 5000 PKR — Use code ITALIA10"*.

---

## 8. Convert Static Sections to Data-Driven

| Section | Current | → WP-Powered |
|---|---|---|
| Hero | Static HTML | Keep static (editorial content) |
| Trust Bar | Missing | Add 4-column: Free Shipping / Authentic / Secure / Returns |
| Featured Products | Missing | Add `data-wp-post-type="product"` section — rendered via JS |
| Brand Cards | Missing | Add brand grid — rendered from ACF or fallback data |
| Product Cards | Missing (no shop section) | Add shop page with filterable grid |
| Testimonials | Missing | Add `data-wp-post-type="testimonial"` section |
| Blog | Missing | Add blog section with post cards |

---

## 9. Add Product Card Component

Per `DESIGN.md` `product-card`:

```js
function createProductCard(p) {
  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-card-img">
        ${p.badge ? `<span class="badge-${p.badgeClass}">${p.badge}</span>` : ''}
        <span class="brand-tag">${p.brand}</span>
      </div>
      <div class="product-card-body">
        <span class="product-line">${p.line}</span>
        <h3 class="product-title">${p.name}</h3>
        <div class="stars">${'★'.repeat(p.rating)}</div>
        <div class="product-price">€${p.price.toFixed(2)}</div>
        <button class="btn btn-primary btn-sm">Add to Cart</button>
      </div>
    </article>
  `;
}
```

Add CSS from `DESIGN.md` `product-card` spec: white card, `--radius-lg` (8px), 1px `--hairline` border, `--shadow-sm` resting, `--shadow-md` on hover.

---

## 10. Add Brand Cards Component

Per `DESIGN.md` `brand-card` — Create 4 cards (Maxylook, Genus, Versum, UNA) with gradient headers (purple, dark, gold, pink), brand name, description, "Shop" CTA.

---

## 11. Add Shop Filters

Add a sidebar with filter controls:
- **Brand** (checkboxes: Maxylook, Genus, Versum, UNA)
- **Category** (checkboxes: Shampoo, Mask, Treatment, Serum)
- **Price Range** (slider or presets)
- **Clear All** button

JS filter function that filters `products` array and re-renders the grid. Mobile: off-canvas drawer per `DESIGN.md` `shop-sidebar`.

---

## 12. Add Cart Functionality (Basic)

- Cart count badge in header
- `addToCart(productId)` function
- Simple cart array in JS localStorage
- Cart drawer or mini-cart overlay (per `DESIGN.md`)

---

## 13. Add Scroll Animations

Per `DESIGN.md` — Add IntersectionObserver-based fade-up animations on sections. Add `fade-up` class to grids and cards. Trigger `visible` class at 0.1 threshold.

---

## 14. Design Tokens — Already Match DESIGN.md

The existing `index.html` `:root` already uses Italia Cosmetics colors (purple `#8B5FBF`, lavender `#F8F5FC`, pink `#F37AA2`, gold `#D4AF37`, Playfair + Poppins fonts). **No rebranding needed.** Verify and align any missing tokens:

- [ ] Add `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- [ ] Add `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (12px)
- [ ] Add badge tokens (`--badge-sale`, `--badge-new`, `--badge-best-seller`)
- [ ] Ensure `--font-display` and `--font-body` are used consistently

---

## 15. Required WordPress Plugins

| Plugin | Purpose |
|---|---|
| **WooCommerce** | Product catalog & REST API |
| **Advanced Custom Fields (ACF)** | Custom fields for brands, testimonials |
| **ACF to REST API** | Expose ACF fields via REST |
| **Contact Form 7** | Form handling |
| **CF7 REST API** | Submit forms via fetch() |
| **Custom Post Type UI** | Create `testimonial`, `brand` CPTs |
| **WPGraphQL** (optional) | Alternative to REST API |
| **Yoast SEO** (optional) | SEO metadata via REST API |

---

## 16. Recommended Implementation Order

1. **Backup** existing `index.html`
2. **Add `WP` config object** & utility functions (`wpFetch`, `wpPost`, `formatPrice`)
3. **Add `fallbackProducts`** array with real product data
4. **Add `fetchProducts()`** WooCommerce integration
5. **Add SPA navigation** (`data-page`, `navigateTo()`, hash routing)
6. **Add Announcement Bar** (charcoal + gold)
7. **Add Trust Bar** (4-column: shipping, authentic, secure, returns)
8. **Add Shop page** with product grid, filters, pagination
9. **Add Brand Cards** (4-brand gradient showcase)
10. **Add Product Cards** with badges, stars, pricing
11. **Add CF7 integration** for contact form
12. **Add Cart** (basic localStorage + count badge)
13. **Add Testimonials section** (`data-wp-post-type="testimonial"`)
14. **Add Blog section** with post cards
15. **Add Scroll animations** (IntersectionObserver)
16. **Test** — verify all data loads from `http://italiacosmeticscom.local/`

---

## 17. Files Reference

| File | Path |
|---|---|
| Source site (to enhance) | `/Users/pc/Downloads/italiacosmetics.com/index.html` |
| Design system spec | `/Users/pc/Downloads/italiacosmetics.com/DESIGN.md` |
| Local WordPress | `http://italiacosmeticscom.local/` |
