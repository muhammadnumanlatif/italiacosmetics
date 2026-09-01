---
version: 1.0
name: italia-cosmetics-design-system
description: >
  A premium multi-brand cosmetics e-commerce design language. The base canvas is **Pure White** (`#ffffff`) with **Light Lavender** (`#F8F5FC`) alternating bands for editorial warmth. The primary brand voltage is **Purple** (`#8B5FBF`) — used on primary CTAs, brand headers, and key interactive elements. **Soft Pink** (`#F37AA2`) and **Gold** (`#D4AF37`) serve as accent notes for badges, highlights, and secondary visual interest. Type runs **Playfair Display** for all headings and **Poppins** for body text, prices, and buttons. Spacing follows a 4px base ladder. The visual signature is clean editorial photography (represented via gradients and icons), generous whitespace, and subtle elevation via soft drop shadows — never harsh.

colors:
  primary: "#8B5FBF"
  primary-active: "#6B3FA0"
  primary-hover: "#7A4DB0"
  primary-light: "#A07DD6"
  ink: "#232323"
  body: "#6A6A6A"
  body-strong: "#232323"
  body-on-light: "#232323"
  muted: "#8A8A8A"
  muted-soft: "#B0B0B0"
  hairline: "#E8E4ED"
  hairline-soft: "#F0EDF5"
  canvas: "#FFFFFF"
  canvas-alt: "#F8F5FC"
  canvas-elevated: "#FDFCFE"
  canvas-light: "#FFFFFF"
  surface-card: "#FFFFFF"
  surface-soft-light: "#F8F5FC"
  surface-strong-light: "#F0EDF5"
  on-primary: "#FFFFFF"
  on-dark: "#FFFFFF"
  on-light: "#232323"
  accent-pink: "#F37AA2"
  accent-pink-dark: "#E05A86"
  accent-gold: "#D4AF37"
  accent-gold-light: "#E8C84A"
  semantic-info: "#5B8DEF"
  semantic-success: "#2E8B57"
  semantic-warning: "#D4AF37"
  semantic-error: "#E05A86"

typography:
  display-mega:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.5px
  display-xl:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
  display-lg:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 38px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.3px
  display-md:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.2px
  title-md:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  title-sm:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0
  body-sm:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  caption:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption-uppercase:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 1px
    textTransform: uppercase
  button:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 1px
    textTransform: uppercase
  nav-link:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.8px
    textTransform: uppercase
  price-display:
    fontFamily: "'Poppins', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
  brand-heading:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px

spacing:
  xxxs: 4px
  xxs: 8px
  xs: 16px
  sm: 24px
  md: 32px
  lg: 48px
  xl: 64px
  xxl: 96px
  super: 128px

shadows:
  small: "0 2px 8px rgba(35,35,35,0.06)"
  medium: "0 4px 20px rgba(35,35,35,0.10)"
  large: "0 8px 40px rgba(35,35,35,0.14)"

components:
  announcement-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.accent-gold}"
    typography: "{typography.caption-uppercase}"
    height: 40px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 72px
    borderBottom: "1px solid {colors.hairline}"
  mobile-menu:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 28px
    height: 48px
    shadow-hover: "{shadows.small}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    border: "1.5px solid {colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px 28px
    height: 48px
  button-gold:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 28px
    height: 48px
  hero-band:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.ink}"
    typography: "{typography.display-mega}"
    padding: 64px 0
    gradient: "linear-gradient(135deg, {colors.canvas-alt} 0%, #F0E8F8 50%, {colors.canvas} 100%)"
  hero-split:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 64px 0
    gridColumns: "1fr 1fr"
  trust-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    borderTop: "1px solid {colors.hairline}"
    borderBottom: "1px solid {colors.hairline}"
  brand-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 0
    border: "1px solid {colors.hairline}"
    shadow-hover: "{shadows.medium}"
  product-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 0
    border: "1px solid {colors.hairline}"
    shadow-hover: "{shadows.medium}"
  product-card-img:
    backgroundColor: "{colors.canvas-alt}"
    height: 200px
  badge-sale:
    backgroundColor: "{colors.accent-pink}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  badge-new:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  badge-best-seller:
    backgroundColor: "{colors.accent-gold}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  brand-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.caption-uppercase}"
    rounded: "{rounded.sm}"
    padding: 3px 8px
  promo-card:
    rounded: "{rounded.lg}"
    padding: 24px
    minHeight: 200px
  featured-product-section:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    padding: 96px 0
  price-display:
    typography: "{typography.price-display}"
    textColor: "{colors.primary}"
  stars:
    color: "{colors.accent-gold}"
    fontSize: 11px
  form-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
    border: "1px solid {colors.hairline}"
    height: 48px
    focus-border: "{colors.primary}"
    focus-shadow: "0 0 0 3px rgba(139,95,191,0.1)"
  contact-card:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  footer-dark:
    backgroundColor: "{colors.ink}"
    textColor: "rgba(255,255,255,0.6)"
    typography: "{typography.body-sm}"
    padding: 64px 0 24px
  footer-link:
    backgroundColor: transparent
    textColor: "rgba(255,255,255,0.6)"
    typography: "{typography.body-sm}"
    hover-color: "{colors.accent-gold}"
  newsletter-input-band:
    backgroundColor: "{colors.canvas-alt}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 32px
  shop-sidebar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.hairline}"
  blog-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 0
    border: "1px solid {colors.hairline}"
    shadow-hover: "{shadows.medium}"
  value-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 32px
    border: "1px solid {colors.hairline}"
    shadow-hover: "{shadows.medium}"
---

## Overview

Italia Cosmetics is a premium multi-brand cosmetics e-commerce site that reads as an elegant, feminine, and editorial beauty destination. The base canvas is **Pure White** (`{colors.canvas}` — #ffffff) with **Light Lavender** (`{colors.canvas-alt}` — #F8F5FC) alternating bands for editorial warmth and visual rhythm. The single brand voltage is **Purple** (`{colors.primary}` — #8B5FBF), used on primary CTAs, brand headers, and key interactive elements. **Soft Pink** (`{colors.accent-pink}` — #F37AA2) and **Gold** (`{colors.accent-gold}` — #D4AF37) serve as accent notes for badges, promotions, and secondary highlights.

Type runs **Playfair Display** (serif) for all headings and display roles, paired with **Poppins** (sans-serif) for body text, prices, and buttons. This serif/sans pairing creates a luxe editorial feel while maintaining readability and modern cleanliness.

The brand's strongest visual signature is the **lavender-to-white gradient hero** with a 50/50 split layout — editorial headline copy on the left, floating product icons and decorative circles on the right. Spacing follows a 4px base ladder: `xxxs` 4 / `xxs` 8 / `xs` 16 / `sm` 24 / `md` 32 / `lg` 48 / `xl` 64 / `xxl` 96 / `super` 128.

**Key Characteristics:**
- Dual-type hierarchy: Playfair Display (headings) + Poppins (body/UI) — editorial luxury meets modern clarity.
- Single primary accent: `{colors.primary}` (Purple #8B5FBF) for CTAs, badges, brand elements.
- Pink + Gold as secondary accents: `{colors.accent-pink}` for sale badges, `{colors.accent-gold}` for best-seller badges and star ratings.
- White canvas (#ffffff) with lavender alternating bands — never dark mode.
- CTA labels render uppercase with 1px tracking via `{typography.button}`.
- Moderate `{rounded.md}` (6px) on CTAs and `{rounded.lg}` (8px) on cards — soft, approachable, feminine.
- Pill-shaped `{rounded.full}` badges reserved for brand tags and sale/new/best-seller labels.
- Subtle elevation via drop shadow tokens — `{shadows.small}`, `{shadows.medium}`, `{shadows.large}` — on hover states.
- Generous editorial spacing with clear content hierarchy.
- 4-brand portfolio structure: Maxylook, Genus, Versum, UNA.

## Color Palette

### Brand & Accent
- **Purple** (`{colors.primary}` — #8B5FBF): The signature Italia Cosmetics color. Primary CTA fill, brand headers, interactive elements, key decorative accents.
- **Purple Active** (`{colors.primary-active}` — #6B3FA0): Press state for interactive elements.
- **Purple Hover** (`{colors.primary-hover}` — #7A4DB0): Hover state accent.
- **Purple Light** (`{colors.primary-light}` — #A07DD6): Lighter tint for secondary decorative use.
- **Soft Pink** (`{colors.accent-pink}` — #F37AA2): Sale badges, promotional banners, feminine accent notes.
- **Pink Dark** (`{colors.accent-pink-dark}` — #E05A86): Press state for pink elements.
- **Gold** (`{colors.accent-gold}` — #D4AF37): Best-seller badges, star ratings, premium highlights.
- **Gold Light** (`{colors.accent-gold-light}` — #E8C84A): Hover state for gold elements.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): White page floor — primary background.
- **Canvas Alt** (`{colors.canvas-alt}` — #F8F5FC): Light lavender alternating band — editorial warmth.
- **Canvas Elevated** (`{colors.canvas-elevated}` — #FDFCFE): Near-white for subtle card differentiation.
- **Surface Card** (`{colors.surface-card}` — #ffffff): White card surfaces on lavender or white backgrounds.
- **Surface Soft Light** (`{colors.surface-soft-light}` — #F8F5FC): Same as canvas-alt.
- **Surface Strong Light** (`{colors.surface-strong-light}` — #F0EDF5): Slightly darker lavender for dividers and secondary backgrounds.

### Hairlines
- **Hairline** (`{colors.hairline}` — #E8E4ED): 1px divider on white — subtle lavender-grey.
- **Hairline Soft** (`{colors.hairline-soft}` — #F0EDF5): Lighter divider for subtle separation.

### Text
- **Ink** (`{colors.ink}` — #232323): Headings, strong emphasis — dark charcoal, near-black.
- **Body** (`{colors.body}` — #6A6A6A): Default running-text color.
- **Body Strong** (`{colors.body-strong}` — #232323): Same as ink.
- **Body On Light** (`{colors.body-on-light}` — #232323): Default text on all surfaces.
- **Muted** (`{colors.muted}` — #8A8A8A): Secondary text, captions, meta.
- **Muted Soft** (`{colors.muted-soft}` — #B0B0B0): Disabled or placeholder text.
- **On Primary** (`{colors.on-primary}` — #ffffff): White text on Purple.

### Semantic
- **Info** (`{colors.semantic-info}` — #5B8DEF): Info badges, callout backgrounds.
- **Success** (`{colors.semantic-success}` — #2E8B57): Confirmation, success states.
- **Warning** (`{colors.semantic-warning}` — #D4AF37): Same as gold — warnings and highlights.
- **Error** (`{colors.semantic-error}` — #E05A86): Validation errors, required indicators.

## Typography

### Font Family
**Playfair Display** (serif) for all display and heading roles. **Poppins** (sans-serif) for all body text, prices, buttons, navigation, and UI labels. This serif/sans pairing creates editorial luxury while maintaining modern usability.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-mega}` | 56px | 700 | 1.15 | -0.5px | Homepage hero h1 |
| `{typography.display-xl}` | 48px | 700 | 1.2 | -0.3px | Subsidiary heroes, page titles |
| `{typography.display-lg}` | 38px | 700 | 1.25 | -0.3px | Section headers |
| `{typography.display-md}` | 30px | 700 | 1.3 | -0.2px | Sub-section headers |
| `{typography.title-md}` | 20px | 600 | 1.3 | 0 | Component titles, brand names |
| `{typography.title-sm}` | 14px | 600 | 1.4 | 0 | List labels, card subtitles |
| `{typography.body-md}` | 14px | 400 | 1.7 | 0 | Default body, product descriptions |
| `{typography.body-sm}` | 13px | 400 | 1.6 | 0 | Footer body, secondary text |
| `{typography.caption}` | 12px | 400 | 1.5 | 0 | Photo captions, meta data |
| `{typography.caption-uppercase}` | 11px | 600 | 1.4 | 1px (uppercase) | Badges, section labels, tags |
| `{typography.button}` | 12px | 600 | 1.0 | 1px (uppercase) | CTA buttons |
| `{typography.nav-link}` | 12px | 600 | 1.4 | 0.8px (uppercase) | Top-nav menu items |
| `{typography.price-display}` | 24px | 700 | 1.2 | -0.3px | Product prices |

### Principles
- **Headings use Playfair Display at weight 700.** Serif elegance for editorial authority.
- **Body text uses Poppins at weight 400.** Clean, readable, modern sans-serif.
- **CTA labels are uppercase with 1px tracking.** Clear call-to-action voice.
- **Nav labels are uppercase with 0.8px tracking.** Consistent with CTA voice.
- **No negative letter-spacing on body.** Reserved for display sizes only.
- **Star ratings render in Gold** (`{colors.accent-gold}`).

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxxs}` 4px · `{spacing.xxs}` 8px · `{spacing.xs}` 16px · `{spacing.sm}` 24px · `{spacing.md}` 32px · `{spacing.lg}` 48px · `{spacing.xl}` 64px · `{spacing.xxl}` 96px · `{spacing.super}` 128px.
- **Section padding:** `{spacing.xl}`–`{spacing.xxl}` (64px–96px) for major bands.

### Grid & Container
- Max content width: 1280px. 
- Hero section: 50/50 split grid at desktop (content | visual), single column at mobile.
- Product grids: 4-up at desktop, 3-up at tablet, 2-up at mobile.
- Brand grid: 4-up at desktop, 2-up at mobile.
- Trust bar: 4-up at desktop, 2-up at mobile.
- Promo banners: 3-up at desktop, 2-up at tablet, 1-up at mobile.
- Footer: 4-column at desktop, 2-column at tablet, 1-column at mobile.
- Blog layout: 2/3 posts + 1/3 sidebar at desktop, single column at mobile.
- Contact layout: 1/1 split at desktop, single column at mobile.
- Shop layout: 260px sidebar + 1fr product grid at desktop, full-width at mobile (sidebar toggles off-canvas).

### Whitespace Philosophy
Generous editorial pacing. The hero section commands the most space with a 50/50 split. Body sections breathe with 24–32px internal padding on cards and 64–96px section spacing. The lavender alternating bands create visual rhythm without crowding.

## Elevation & Depth

The system uses **soft drop shadows + color contrast** for elevation. Three shadow tiers are defined.

| Level | Treatment | Use |
|---|---|---|
| Flat (canvas) | `{colors.canvas}` (#ffffff) | Page body, bands |
| Alt band | `{colors.canvas-alt}` (#F8F5FC) | Alternating editorial sections |
| Card | `{colors.surface-card}` (#ffffff) + 1px `{colors.hairline}` | Product cards, brand cards |
| Elevated | `{shadows.small}` (0 2px 8px rgba(35,35,35,0.06)) | Default card state |
| Hover | `{shadows.medium}` (0 4px 20px rgba(35,35,35,0.10)) | Hovered cards |
| Modal | `{shadows.large}` (0 8px 40px rgba(35,35,35,0.14)) | Overlays, modal dialogs |
| Gradient hero | `linear-gradient(135deg, #F8F5FC, #F0E8F8, #ffffff)` | Hero band depth |

### Decorative Depth
- **Lavender gradient hero** is the brand's primary depth treatment for page entries.
- **Brand gradient cards** (purple, pink, gold, dark) used for promotional banners.
- **Hero decorative circles** — semi-transparent purple/pink/gold circles with pulse animation for visual interest.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Reserved for specific editorial layouts |
| `{rounded.xs}` | 2px | Minimal separation (rare) |
| `{rounded.sm}` | 4px | Tight badges (rare) |
| `{rounded.md}` | 6px | CTAs, form inputs — standard interactive radius |
| `{rounded.lg}` | 8px | Cards, modals — standard container radius |
| `{rounded.xl}` | 12px | Featured sections, large promo cards |
| `{rounded.full}` | 9999px | Badge pills, brand tags, social icons |

The radius vocabulary is **soft and approachable**. CTAs use `{rounded.md}` (6px) — feminine and modern. Cards use `{rounded.lg}` (8px). Pills are reserved for badges and tags only.

## Components

### Top Navigation
**`top-nav`** — White background, `{colors.ink}` text, height 72px, 1px `{colors.hairline}` bottom border. Layout: brand logo left (Italia Cosmetics with spa icon), primary horizontal menu (Home / Shop / Brands / About / Blog / Contact), actions right (search, wishlist, cart with count badge). Menu items render uppercase with 0.8px tracking. Mobile: hamburger menu at < 1024px.

**`mobile-menu`** — Full-screen overlay on mobile. Brand logo top, close button, vertical navigation list with border separators. Links render uppercase with letter-spacing 0.5px.

### Announcement Bar
**`announcement-bar`** — Charcoal background, Gold text. Centered shipping promo + discount code. Height 40px. Appears above the header.

### Buttons
**`button-primary`** — The signature Purple CTA. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}` (12px / 600 / 1px tracking, uppercase), padding 12px × 28px, height 48px, rounded `{rounded.md}` (6px). Hover: `{colors.primary-hover}`, lifts with `{shadows.small}`.

**`button-primary-active`** — Press state. Background `{colors.primary-active}`.

**`button-secondary`** — Outline variant. Transparent with 1.5px Purple border, text `{colors.primary}`. Same geometry. Hover: `{colors.canvas-alt}` background fill.

**`button-gold`** — Gold variant for promotional contexts. Background `{colors.accent-gold}`, text `{colors.ink}`.

### Hero Band
**`hero-band`** — Lavender gradient background. 50/50 grid split at desktop. Left side: headline in `{typography.display-mega}` (56px / 700 / -0.5px), body copy, dual CTAs. Right side: floating product icon cards with decorative semi-transparent circles. The hero is the brand's primary visual statement.

### Trust Bar
**`trust-bar`** — Full-width band with 4-column grid. Each item: icon (Purple), title (uppercase, 13px, 600 weight), subtitle (12px, muted). Top and bottom hairlines for separation.

### Brand Cards
**`brand-card`** — White card with 1px hairline border, `{rounded.lg}`. Image band at top with brand-specific gradient (Maxylook: purple gradient, Genus: dark gradient, Versum: gold gradient, UNA: pink gradient) showing brand name. Body: brand name heading + description. Hover: `{shadows.medium}` elevation + -4px translateY.

### Product Cards
**`product-card`** — White card with 1px hairline border, `{rounded.lg}`. Structure: image area (lavender background with category icon), optional badge (sale= pink pill, new= purple pill, best seller= gold pill), brand tag (charcoal pill top-right), body with brand/line name, product title, star rating (gold), price (Poppins 700, purple for emphasis), and "Add to Cart" button. Hover: `{shadows.medium}` elevation + -4px translateY.

### Promo Banners
**`promo-card`** — Three-up grid. Each card has a gradient background (purple, pink, gold, dark, or lavender). Heading in Playfair Display, body text, ghost CTA button.

### Featured Product Section
**`featured-product-section`** — Lavender background band. 50/50 split: left side visual (gradient background with product icon), right side editorial (headline, description, price with strikethrough original, primary CTA).

### Badges & Tags
**`badge-sale`** — Pink pill (`{colors.accent-pink}`). **`badge-new`** — Purple pill. **`badge-best-seller`** — Gold pill. All use `{typography.caption-uppercase}` (11px / 600 / 1px tracking, uppercase), `{rounded.full}`. Positioned absolute at top-left of product card image.

**`brand-tag`** — Charcoal pill, `{rounded.sm}`, positioned absolute at top-right of product card image. Shows brand name in white, 8px uppercase.

### Forms
**`form-input`** — White background, `{rounded.md}` (6px), 1px `{colors.hairline}` border, padding 12px × 14px, height 48px. Focus state: `{colors.primary}` border + subtle purple glow (3px rgba shadow).

**`contact-form`** — White card with hairline border, `{rounded.lg}`, padding 32px. Holds form groups with label, input/textarea/select, and submit CTA.

### Shop Sidebar
**`shop-sidebar`** — White, 1px hairline, `{rounded.lg}`, padding 24px. Sticky positioning below header. Contains filter groups (Brand with checkboxes, Category with checkboxes, etc.), clear-all button. Mobile: slides in as off-canvas drawer with overlay.

### Blog Cards
**`blog-card`** — White card with hairline, `{rounded.lg}`. Gradient image area at top (color-coded), body with meta (date + author), headline (Playfair Display 20px / 600), excerpt, secondary "Read More" CTA. Hover: elevation.

### Footer
**`footer-dark`** — Charcoal (`{colors.ink}`) background. 4-column grid: brand column (logo in white/gold, about text, social icons in circular hover-to-purple containers), shop links, company links, support links. Column headers: uppercase Poppins 12px / 600 / 1px tracking. Links: muted white with gold hover. Bottom bar: copyright centered.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (Purple) for primary CTAs, brand headers, and key interactive elements.
- Use `{colors.accent-pink}` for sale badges and `{colors.accent-gold}` for best-seller badges.
- Set CTAs at `{rounded.md}` (6px) — the brand's signature button radius.
- Render CTA labels in uppercase with 1px tracking via `{typography.button}`.
- Use Playfair Display for all headings and Poppins for all body/UI text.
- Pair every page with generous editorial spacing via the 4px token ladder.
- Use the lavender gradient hero on the homepage as the primary visual statement.
- Use `{shadows.medium}` on hover states for cards.

### Don't
- Don't introduce a saturated brand color other than Purple, Pink, or Gold.
- Don't use sharp 0px corners on CTAs — `{rounded.md}` (6px) is the brand standard.
- Don't use dark mode — the brand lives on white + lavender canvases.
- Don't use heavy body weights. Poppins 400 is the running text standard.
- Don't use pure black for text. Brand text is `{colors.ink}` (#232323) — dark charcoal.
- Don't mix fonts outside the Playfair + Poppins pairing.
- Don't use placeholder/lorem ipsum content for products — use real brand data.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Hero heading 56→32px; hero grid stacks to single column; product grid 2-up; brand grid 2-up; nav hamburger; shop sidebar off-canvas; promo grid 1-up. |
| Tablet | 640–1024px | Hero heading 42px; product grid 3-up; brand grid 4-up; promo grid 2-up; footer 2-column. |
| Desktop | 1024–1280px | Full hero 56px; product grid 4-up; promo grid 3-up; footer 4-column; shop sidebar visible. |
| Wide | > 1280px | Content caps at 1280px; hero continues full-width with gradient. |

### Touch Targets
- Primary CTA at 48px height — meets WCAG AAA (44 × 44).
- Nav items render uppercase with 0.8px tracking, padded for effective 48px tap area.
- Filter checkboxes sized for comfortable touch interaction.

### Collapsing Strategy
- Top nav switches to hamburger below 1024px.
- Hero grid stacks to single column below 768px; floating product icons reduce to 2-up.
- Product grid: 4→3→2 columns.
- Brand grid: 4→2 columns.
- Promo grid: 3→2→1 columns.
- Footer: 4→2→1 columns.
- Shop sidebar: transitions to off-canvas overlay below 768px with backdrop.
- Blog: 2-column layout stacks to single column below 768px.
- Contact: 2-column layout stacks to single column below 768px.

## Iteration Guide

1. Focus on a single page at a time — all 6 pages share the same component library.
2. CTAs default to `{rounded.md}` (6px). Cards use `{rounded.lg}` (8px). Pill is for badges.
3. Variants live as separate entries inside `components:`.
4. Use `{token.refs}` everywhere — never inline hex.
5. Hover state documented as shadow elevation and -4px translateY.
6. Playfair Display 700 for headings, Poppins 400/600 for body. Uppercase + tracking on CTAs and nav.
7. Purple stays primary; pink and gold are supporting accents.
8. Use the explicit 4px named spacing ladder.

## Brands Data Reference

### Maxylook
- **Origin:** Italy
- **Focus:** Superfood-infused professional haircare
- **Lines:** Collagen, Macadamia, Protein, Fresh Mint, Arganway, Maxy Style, Violet Pigment, Harmonic Color, N•Factor
- **Key Products:** Protecting Shampoo, Hydrating Mask, No Yellow Shampoo, Intense Hydrating Mask, Revitalizing Treatment, Leave-in Oil, Extreme Mousse/Hair Spray
- **Colors:** Purple gradient (#8B5FBF → #A07DD6)
- **Known Gaps:** Maxylook's full color line (Harmonic Color permanent colors, direct dyes, developers) not included in initial build.

### Genus
- **Origin:** International (global distribution)
- **Focus:** Professional hair care with specialized targeted lines
- **Lines:** Argan, Intense Restoring, Hyaluronic Acid, Keratin, Milk, Energy, GreenUS, Seven Shades, Expressions
- **Key Products:** Moisturizing Serum, Hydrating Shampoo/Mask, Intense Restoring Lotion/Mask/Fluid Oil, Color Protection Shampoo, Curative Shampoo
- **Colors:** Dark gradient (#232323 → #3A3A3A)

### Versum Hair 2.0
- **Origin:** International
- **Focus:** Science-meets-beauty innovation with lamellar technology
- **Lines:** Hydrator, Charcoal Detox, Active Bloom, Soft Touch, R-tech, Advance, Fusión, Element, Finish
- **Key Products:** Moisturizing Shampoo/Mask, Normalizing Shampoo/Treatment, Age Defying Lamellar Elixir, Reinforcing Shampoo/Lotion, Artis Crystal Drops, Extra Silver Shampoo
- **Colors:** Gold gradient (#D4AF37 → #E8C84A)

### UNA (Rolland USA)
- **Origin:** USA
- **Focus:** High-performance treatments for hair loss, repair, and hydration
- **Lines:** Stop Loss, Fortify, Hydro-In, Repair, Hair Food, Etnika, Finish, Post
- **Key Products:** Drop Oxygenating Scalp Treatment, Stop Loss System, Moisturizing Hair Mask, Revitalizing Conditioner, Protein Treatment, Coconut Oil Mask
- **Colors:** Pink gradient (#F37AA2 → #E05A86)

## Known Gaps

- Product images: Represented via Font Awesome icons and gradient placeholders; real product photography needed.
- Animation timings (hero circle pulse, card entrance, cart drawer) out of scope for initial build.
- Cart functionality: Add-to-cart with count badge implemented; full cart drawer, checkout flow, and payment integration TBD.
- Brand product data: Extracted from live URLs; images and some descriptions are representative.
- Blog content: Posts are illustrative examples; real editorial content needed.
- Form validation: Basic HTML5 validation; server-side integration TBD.
- Search functionality: Search icon links to shop page; full text search TBD.
- User accounts: Login/registration UI placeholder; full auth flow TBD.
- Multi-currency: Maxylook prices in EUR, others in PKR; consistent currency strategy TBD.
