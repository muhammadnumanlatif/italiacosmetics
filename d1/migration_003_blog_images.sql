-- Adds product photography to blog posts, replacing the gradient+icon
-- placeholder tiles. Every post is mapped to the real product it discusses
-- (or, for topic/roundup posts, the closest matching real product) using
-- the live `products.img` values -- no stock photos, no invented URLs.

ALTER TABLE blog_posts ADD COLUMN img TEXT NOT NULL DEFAULT '';

UPDATE blog_posts SET img = 'https://www.maxylook.it/708-home_default/protecting-mask-1000-ml.jpg' WHERE id = 1;
UPDATE blog_posts SET img = 'https://www.versumhair.com/wp-content/uploads/2026/03/Age-Defying-Lamellar-Elixir.png' WHERE id = 2;
UPDATE blog_posts SET img = 'https://www.maxylook.it/612-home_default/hydrating-shampoo-1000-ml.jpg' WHERE id = 3;
UPDATE blog_posts SET img = 'https://www.maxylook.it/693-home_default/nourishing-shampoo-1000-ml.jpg' WHERE id = 4;
UPDATE blog_posts SET img = 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Compensating_Shampoo_1000ml_copia.png?v=1733153687' WHERE id = 101;
UPDATE blog_posts SET img = 'https://genushair.com/wp-content/uploads/2023/12/Keratin-copy-4No-BKG.png' WHERE id = 102;
UPDATE blog_posts SET img = 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Purifying_Shampoo_1000_ML.png?v=1733177011' WHERE id = 201;
UPDATE blog_posts SET img = 'https://cdn.shopify.com/s/files/1/0326/9541/9016/products/DailyGentleShampoo1000ml.jpg?v=1679349387' WHERE id = 202;
UPDATE blog_posts SET img = 'https://genushair.com/wp-content/uploads/2023/12/Color-copy-3No-BKG.png' WHERE id = 203;
UPDATE blog_posts SET img = 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Oxygenating_Scalp_Treatment.png?v=1733155079' WHERE id = 205;
UPDATE blog_posts SET img = 'https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Mediterranean-Oil.png' WHERE id = 206;
UPDATE blog_posts SET img = 'https://genushair.com/wp-content/uploads/2023/12/KeratinNo-BKG.png' WHERE id = 207;
UPDATE blog_posts SET img = 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Daily-Hair-Conditioner-1000ml.png?v=1733156849' WHERE id = 208;
UPDATE blog_posts SET img = 'https://www.versumhair.com/wp-content/uploads/2026/03/Anti-frizz-Mask.png' WHERE id = 209;
UPDATE blog_posts SET img = 'https://www.versumhair.com/wp-content/uploads/2026/03/Charcoal-Detox-Shampoo-1.png' WHERE id = 210;
UPDATE blog_posts SET img = 'https://www.maxylook.it/612-home_default/hydrating-shampoo-1000-ml.jpg' WHERE id = 301;
UPDATE blog_posts SET img = 'https://www.maxylook.it/693-home_default/nourishing-shampoo-1000-ml.jpg' WHERE id = 302;
UPDATE blog_posts SET img = 'https://www.maxylook.it/595-home_default/no-yellow-shampoo-1000ml.jpg' WHERE id = 303;
UPDATE blog_posts SET img = 'https://www.maxylook.it/730-home_default/restructuring-nourishing-shampoo-1000-ml.jpg' WHERE id = 304;
UPDATE blog_posts SET img = 'https://www.maxylook.it/134-home_default/shampoo-moisture-repair-500-ml.jpg' WHERE id = 305;
UPDATE blog_posts SET img = 'https://www.maxylook.it/536-home_default/protecting-shampoo-1000ml.jpg' WHERE id = 306;
UPDATE blog_posts SET img = 'https://www.maxylook.it/544-home_default/revitalizing-shampoo-1000-ml.jpg' WHERE id = 307;
UPDATE blog_posts SET img = 'https://www.maxylook.it/711-home_default/hydrating-shampoo-300-ml.jpg' WHERE id = 311;
UPDATE blog_posts SET img = 'https://www.maxylook.it/590-home_default/hydrating-mask-300ml.jpg' WHERE id = 312;
UPDATE blog_posts SET img = 'https://www.maxylook.it/712-home_default/hydrating-mask-1000ml.jpg' WHERE id = 313;
UPDATE blog_posts SET img = 'https://www.maxylook.it/706-home_default/nourishing-shampoo-300-ml.jpg' WHERE id = 314;
UPDATE blog_posts SET img = 'https://www.maxylook.it/710-home_default/nourishing-mask-1000-ml.jpg' WHERE id = 315;
UPDATE blog_posts SET img = 'https://www.maxylook.it/694-home_default/nourishing-mask-300-ml.jpg' WHERE id = 316;
UPDATE blog_posts SET img = 'https://www.maxylook.it/722-home_default/no-yellow-shampoo-300ml.jpg' WHERE id = 317;
UPDATE blog_posts SET img = 'https://www.maxylook.it/597-home_default/no-yellow-mask-300ml.jpg' WHERE id = 318;
UPDATE blog_posts SET img = 'https://www.maxylook.it/759-home_default/restructuring-nourishing-shampoo-250-ml.jpg' WHERE id = 319;
UPDATE blog_posts SET img = 'https://www.maxylook.it/760-home_default/restructuring-nourishing-mask-350-ml.jpg' WHERE id = 320;
UPDATE blog_posts SET img = 'https://www.maxylook.it/631-home_default/intense-hydrating-mask-500-ml.jpg' WHERE id = 321;
UPDATE blog_posts SET img = 'https://www.maxylook.it/707-home_default/protecting-shampoo-300-ml.jpg' WHERE id = 322;
UPDATE blog_posts SET img = 'https://www.maxylook.it/708-home_default/protecting-mask-1000-ml.jpg' WHERE id = 323;
UPDATE blog_posts SET img = 'https://www.maxylook.it/539-home_default/protecting-mask-300-ml.jpg' WHERE id = 324;
UPDATE blog_posts SET img = 'https://www.maxylook.it/716-home_default/revitalizing-shampoo-300-ml.jpg' WHERE id = 325;
UPDATE blog_posts SET img = 'https://www.maxylook.it/717-home_default/revitalizing-mask-300-ml.jpg' WHERE id = 326;
UPDATE blog_posts SET img = 'https://www.maxylook.it/718-home_default/revitalizing-mask-1000-ml.jpg' WHERE id = 327;
