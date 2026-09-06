DELETE FROM testimonials;
INSERT INTO testimonials (id, name, role, text, rating, avatar) VALUES
(1, 'Sara Ahmed', 'Salon Owner', 'I''ve been using Maxylook products in my salon for years. The quality is unmatched — my clients notice the difference immediately.', 5, 'SA'),
(2, 'Fatima Khan', 'Beauty Enthusiast', 'The Versum Hydrator line transformed my dry, damaged hair. After just two weeks, it feels like I stepped out of a high-end salon.', 5, 'FK'),
(3, 'Ayesha Malik', 'Professional Stylist', 'Italia Cosmetics delivers authentic Italian products faster than any distributor I''ve worked with. Genus Argan line is my go-to for color-treated hair.', 5, 'AM');

DELETE FROM brands;
INSERT INTO brands (id, css_id, name, gradient, description, text_color, img) VALUES
(1, 'mx', 'Maxylook', 'linear-gradient(135deg,#8B5FBF,#A07DD6)', 'Superfood-powered Italian haircare — Collagen, Macadamia, Argan, and Protein lines that nourish the hair ecosystem.', '#fff', 'https://www.maxylook.it/612-home_default/hydrating-shampoo-1000-ml.jpg'),
(2, 'gn', 'Genus', 'linear-gradient(135deg,#232323,#3A3A3A)', 'Global professional haircare with targeted solutions: Argan, Keratin, Hyaluronic, Milk, and Energy lines for every need.', '#fff', 'https://genushair.com/wp-content/uploads/2023/12/ArganNo-BKG.png'),
(3, 'vs', 'Versum', 'linear-gradient(135deg,#D4AF37,#E8C84A)', 'Where science meets beauty — advanced lamellar technology, charcoal detox, age-defying elixirs, and artis styling.', '#232323', 'https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Color.png'),
(4, 'una', 'UNA', 'linear-gradient(135deg,#F37AA2,#E05A86)', 'High-performance professional treatments — anti-hair loss systems, deep repair, intense hydration, and specialty therapies.', '#fff', 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Oxygenating_Scalp_Treatment.png?v=1733155079');
