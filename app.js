// ==================== WORDPRESS CONFIG ====================
    const WP = {
      url: 'https://api.italiacosmetics.com',
      rest: 'https://api.italiacosmetics.com/wp-json/wp/v2',
      wc: 'https://api.italiacosmetics.com/wp-json/wc/v3',
      acf: 'https://api.italiacosmetics.com/wp-json/acf/v3',
      graphql: 'https://api.italiacosmetics.com/graphql',
      cf7: 'https://api.italiacosmetics.com/wp-json/contact-form-7/v1/contact-forms'
    };

    async function wpFetch(endpoint, options = {}) {
      try {
        const res = await fetch(WP.rest + endpoint, {
          headers: { 'Content-Type': 'application/json', ...options.headers },
          ...options
        });
        if (!res.ok) throw new Error('WP API error: ' + res.status);
        return await res.json();
      } catch (err) {
        console.warn('WP fetch failed, using fallback:', err.message);
        return null;
      }
    }

    async function wpPost(endpoint, data, useFormData = false) {
      try {
        const opts = { method: 'POST' };
        if (useFormData) {
          const fd = new FormData();
          for (const k in data) fd.append(k, data[k]);
          opts.body = fd;
        } else {
          opts.headers = { 'Content-Type': 'application/json' };
          opts.body = JSON.stringify(data);
        }
        const base = useFormData ? WP.url : WP.rest;
        const res = await fetch(base + endpoint, opts);
        if (!res.ok) throw new Error('WP POST error: ' + res.status);
        return await res.json();
      } catch (err) {
        console.warn('WP POST failed:', err.message);
        return null;
      }
    }

    function formatPrice(p) {
      if (p >= 1000000) return '€' + (p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1) + 'M';
      return '€' + p.toLocaleString();
    }

    async function fetchProducts() {
      try {
        const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');

        // Fetch all products with pagination
        let allProducts = [];
        let page = 1;
        let fetched;
        do {
          const res = await fetch(WP.wc + '/products?per_page=100&page=' + page + '&_fields=id,name,description,price,attributes,images,categories,meta_data,total_sales', {
            headers: { 'Authorization': 'Basic ' + auth }
          });
          if (!res.ok) throw new Error('WC API error');
          fetched = await res.json();
          if (fetched.length) allProducts = allProducts.concat(fetched);
          page++;
        } while (fetched.length === 100);

        const wpProducts = allProducts;

        products = wpProducts.map((p, i) => {
          const attrs = {};
          (p.attributes || []).forEach(a => { attrs[a.name.toLowerCase()] = a.options?.[0] || ''; });
          const cat = p.categories?.[0]?.name || 'Product';
          const catMap = { 'Shampoo': 'Shampoo', 'Mask': 'Mask', 'Treatment': 'Treatment', 'Serum': 'Serum', 'Styling': 'Styling', 'Kit': 'Kit' };
          return {
            id: p.id || (i + 1),
            brand: attrs.brand || 'Italia Cosmetics',
            name: p.name || 'Product',
            line: attrs.line || attrs.product_line || '',
            desc: p.description?.replace(/<[^>]*>/g, '') || '',
            price: parseFloat(p.price) || 0,
            currency: (attrs.currency === '$' || attrs.currency === 'USD') ? 'PKR' : (attrs.currency || 'PKR'),
            cat: catMap[cat] || cat,
            badge: attrs.badge || '',
            rating: parseInt(attrs.rating) || 5,
            img: p.images?.[0]?.src || (p.meta_data?.find(m => m.key === 'product_image_url')?.value) || '',
            origPrice: attrs.orig_price ? parseFloat(attrs.orig_price) : null,
            total_sales: parseInt(p.total_sales) || 0
          };
        });

        if (!products.length) throw new Error('No products returned');
      } catch (err) {
        console.warn('WC fetch failed, using fallback:', err.message);
        products = [...fallbackProducts];
      }

      renderBestSellers();
      renderFeaturedProducts();
      renderTestimonials();
      renderBlog();
      if (document.getElementById('page-shop')?.classList.contains('active')) renderShop();

      // ── After products load, render detail page if user landed directly on it ──
      const _activeDetail = document.getElementById('page-product-details');
      if (_activeDetail && _activeDetail.classList.contains('active')) {
        const _id = new URLSearchParams(location.search).get('id');
        if (_id) renderProductDetails(_id);
      }
    }

    async function fetchBrands() {
      try {
        const data = await wpFetch('/brands?per_page=10&_fields=id,title,meta,slug');
        if (data && data.length) {
          const defaultGradients = { mx: 'linear-gradient(135deg,#8B5FBF,#A07DD6)', gn: 'linear-gradient(135deg,#232323,#3A3A3A)', vs: 'linear-gradient(135deg,#D4AF37,#E8C84A)', una: 'linear-gradient(135deg,#F37AA2,#E05A86)' };
          window.wpBrands = data.map((b, i) => ({
            id: b.meta?.brand_css_id || ['mx','gn','vs','una'][i] || ('b' + i),
            name: b.meta?.brand_person_name || b.title?.rendered || b.title,
            gradient: b.meta?.brand_color || defaultGradients[['mx','gn','vs','una'][i]] || defaultGradients.mx,
            desc: b.meta?.brand_desc || '',
            textColor: b.meta?.brand_text_color || '#fff',
            img: b.meta?.brand_image || ''
          }));
          renderBrandCards();
        }
      } catch (e) { console.warn('Brand fetch failed, using fallback'); }
    }

    async function fetchTestimonials() {
      try {
        const data = await wpFetch('/testimonials?per_page=100&_fields=id,title,content,meta,slug');
        if (data && data.length) {
          window.wpTestimonials = data.map(t => ({
            id: t.id,
            name: t.meta?.testimonial_person_name || t.title?.rendered || t.title,
            role: t.meta?.testimonial_role || '',
            text: t.content?.rendered?.replace(/<[^>]*>/g, '') || '',
            rating: parseInt(t.meta?.testimonial_rating) || 5,
            avatar: t.meta?.testimonial_avatar_initials || ((t.title?.rendered || t.title)?.charAt(0).toUpperCase() || 'U')
          }));
          renderTestimonials();
        }
      } catch (e) { console.warn('Testimonial fetch failed, using fallback'); }
    }

    async function fetchAbout() {
      try {
        const data = await wpFetch('/pages?slug=about&_fields=id,title,content');
        if (data && data.length) {
          const page = data[0];
          const container = document.querySelector('#page-about .about-story-text');
          if (container) {
            const title = container.querySelector('h2');
            const paragraphs = container.querySelectorAll('p');
            const content = page.content?.rendered || '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const h2 = doc.querySelector('h2');
            const ps = doc.querySelectorAll('p');
            if (h2 && title) title.textContent = h2.textContent;
            if (ps.length && paragraphs.length) {
              paragraphs.forEach((p, i) => { if (ps[i]) p.textContent = ps[i].textContent; });
            }
          }
        }
      } catch (e) { console.warn('About fetch failed, using fallback'); }
    }

    async function fetchBlogPosts() {
      try {
        const data = await wpFetch('/posts?per_page=10&_fields=id,title,content,excerpt,date,_links');
        if (data && data.length) {
          window.wpBlogPosts = data.map(p => ({
            id: p.id,
            title: p.title?.rendered || '',
            content: p.content?.rendered || '',
            excerpt: p.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            date: new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            author: 'Italia Team',
            gradient: ['linear-gradient(135deg,var(--purple),var(--purple-dark))', 'linear-gradient(135deg,var(--pink),var(--pink-dark))', 'linear-gradient(135deg,var(--gold),var(--gold-light))', 'linear-gradient(135deg,var(--charcoal),var(--charcoal-soft))'][Math.floor(Math.random() * 4)],
            icon: ['fa-wind','fa-oil-can','fa-leaf','fa-shield-alt'][Math.floor(Math.random() * 4)]
          }));
          renderBlog();
          // Handle direct URL access to /single-blog?id=X
          if (window._pendingSingleBlogId) {
            renderSingleBlog(window._pendingSingleBlogId);
            window._pendingSingleBlogId = null;
          }
        }
      } catch (e) { console.warn('Blog fetch failed, using fallback'); }
    }

    // ==================== PRODUCT DATA ====================
    const fallbackProducts = [
      { "id": 1, "brand": "Maxylook", "name": "Hydrating Shampoo 1000 ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 13688.2746, "currency": "PKR", "cat": "Shampoo", "badge": "best", "rating": 5, "img": "https://www.maxylook.it/612-home_default/hydrating-shampoo-1000-ml.jpg" },
      { "id": 2, "brand": "Maxylook", "name": "Hydrating Shampoo 300 ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 7036.029, "currency": "PKR", "cat": "Shampoo", "badge": "best", "rating": 5, "img": "https://www.maxylook.it/711-home_default/hydrating-shampoo-300-ml.jpg" },
      { "id": 3, "brand": "Maxylook", "name": "Nourishing Shampoo 1000 ml", "line": "PROTEIN", "desc": "Professional maxylook product", "price": 12266.8546, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/693-home_default/nourishing-shampoo-1000-ml.jpg" },
      { "id": 4, "brand": "Maxylook", "name": "No Yellow Shampoo 300ml", "line": "VIOLET PIGMENT", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/722-home_default/no-yellow-shampoo-300ml.jpg" },
      { "id": 5, "brand": "Maxylook", "name": "No Yellow Shampoo 1000ml", "line": "VIOLET PIGMENT", "desc": "Professional maxylook product", "price": 14853.839, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/595-home_default/no-yellow-shampoo-1000ml.jpg" },
      { "id": 6, "brand": "Maxylook", "name": "Restructuring and Nourishing Shampoo 250 ml", "line": "PROTEINS & MINERALS OF EGG", "desc": "Professional maxylook product", "price": 13688.2746, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/759-home_default/restructuring-nourishing-shampoo-250-ml.jpg" },
      { "id": 7, "brand": "Maxylook", "name": "Restructuring and Nourishing Shampoo 1000 ml", "line": "PROTEINS & MINERALS OF EGG", "desc": "Professional maxylook product", "price": 12266.8546, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/730-home_default/restructuring-nourishing-shampoo-1000-ml.jpg" },
      { "id": 8, "brand": "Maxylook", "name": "Shampoo Moisture Repair 500 ml", "line": "ARGANWAY", "desc": "Professional maxylook product", "price": 20752.732, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/134-home_default/shampoo-moisture-repair-500-ml.jpg" },
      { "id": 9, "brand": "Maxylook", "name": "Protecting Shampoo 1000ml", "line": "COLLAGEN", "desc": "Professional maxylook product", "price": 13688.2746, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/536-home_default/protecting-shampoo-1000ml.jpg" },
      { "id": 10, "brand": "Maxylook", "name": "Protecting Shampoo 300 ml", "line": "COLLAGEN", "desc": "Professional maxylook product", "price": 7036.029, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/707-home_default/protecting-shampoo-300-ml.jpg" },
      { "id": 11, "brand": "Maxylook", "name": "Revitalizing Shampoo 300 ml", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 7462.454999999999, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/716-home_default/revitalizing-shampoo-300-ml.jpg" },
      { "id": 12, "brand": "Maxylook", "name": "Revitalizing Shampoo 1000 ml", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 14143.128999999999, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/544-home_default/revitalizing-shampoo-1000-ml.jpg" },
      { "id": 13, "brand": "Maxylook", "name": "Nourishing Shampoo 300 ml", "line": "PROTEIN", "desc": "Professional maxylook product", "price": 7391.384, "currency": "PKR", "cat": "Shampoo", "badge": "", "rating": 5, "img": "https://www.maxylook.it/706-home_default/nourishing-shampoo-300-ml.jpg" },
      { "id": 14, "brand": "Maxylook", "name": "Hydrating Mask 300ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/590-home_default/hydrating-mask-300ml.jpg" },
      { "id": 15, "brand": "Maxylook", "name": "Nourishing Mask 1000 ml", "line": "PROTEIN", "desc": "Professional maxylook product", "price": 28001.974, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/710-home_default/nourishing-mask-1000-ml.jpg" },
      { "id": 16, "brand": "Maxylook", "name": "Nourishing Mask 300 ml", "line": "PROTEIN", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/694-home_default/nourishing-mask-300-ml.jpg" },
      { "id": 17, "brand": "Maxylook", "name": "No Yellow Mask 300ml", "line": "VIOLET PIGMENT", "desc": "Professional maxylook product", "price": 11300.288999999999, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/597-home_default/no-yellow-mask-300ml.jpg" },
      { "id": 18, "brand": "Maxylook", "name": "Restructuring and Nourishing Mask 350 ml", "line": "PROTEINS & MINERALS OF EGG", "desc": "Professional maxylook product", "price": 12906.4936, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/760-home_default/restructuring-nourishing-mask-350-ml.jpg" },
      { "id": 19, "brand": "Maxylook", "name": "Intense Hydrating Mask 500 ml", "line": "ARGANWAY", "desc": "Professional maxylook product", "price": 26296.269999999997, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/631-home_default/intense-hydrating-mask-500-ml.jpg" },
      { "id": 20, "brand": "Maxylook", "name": "Protecting Mask 1000 ml", "line": "COLLAGEN", "desc": "Professional maxylook product", "price": 13858.845, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/708-home_default/protecting-mask-1000-ml.jpg" },
      { "id": 21, "brand": "Maxylook", "name": "Protecting Mask 300 ml", "line": "COLLAGEN", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/539-home_default/protecting-mask-300-ml.jpg" },
      { "id": 22, "brand": "Maxylook", "name": "Revitalizing Mask 300 ml", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 8812.804, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/717-home_default/revitalizing-mask-300-ml.jpg" },
      { "id": 23, "brand": "Maxylook", "name": "Revitalizing Mask 1000 ml", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 17412.394999999997, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/718-home_default/revitalizing-mask-1000-ml.jpg" },
      { "id": 24, "brand": "Maxylook", "name": "Hydrating Mask 1000ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 13858.845, "currency": "PKR", "cat": "Mask", "badge": "", "rating": 5, "img": "https://www.maxylook.it/712-home_default/hydrating-mask-1000ml.jpg" },
      { "id": 25, "brand": "Maxylook", "name": "Multi Action 10 in 1 Leave in 200 ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 11556.144600000001, "currency": "PKR", "cat": "Leave-in", "badge": "", "rating": 5, "img": "https://www.maxylook.it/755-home_default/multi-action-10-in-1-leave-in-200-ml.jpg" },
      { "id": 26, "brand": "Maxylook", "name": "Nourishing Conditioner Leave-in", "line": "PROTEIN", "desc": "Professional maxylook product", "price": 11556.144600000001, "currency": "PKR", "cat": "Leave-in", "badge": "", "rating": 5, "img": "https://www.maxylook.it/699-home_default/nourishing-conditioner-leave-in.jpg" },
      { "id": 27, "brand": "Maxylook", "name": "Protecting Dual-phase Spray 300ml", "line": "COLLAGEN", "desc": "Professional maxylook product", "price": 8812.804, "currency": "PKR", "cat": "Leave-in", "badge": "", "rating": 5, "img": "https://www.maxylook.it/750-home_default/protecting-dual-phase-spray-300ml.jpg" },
      { "id": 28, "brand": "Maxylook", "name": "Restructuring and Nourishing Cream to Milk Formula 125ml", "line": "PROTEINS & MINERALS OF EGG", "desc": "Professional maxylook product", "price": 12266.8546, "currency": "PKR", "cat": "Leave-in", "badge": "", "rating": 5, "img": "https://www.maxylook.it/702-home_default/restructuring-and-nourishing-cream-to-milk-formula-125ml.jpg" },
      { "id": 29, "brand": "Maxylook", "name": "Hydrating Treatment Lotion 7ml x 12", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 30134.104000000003, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/754-home_default/hydrating-treatment-lotion-7ml-x-12.jpg" },
      { "id": 30, "brand": "Maxylook", "name": "Hydrating Treatment Lotion 100ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 17696.678999999996, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/721-home_default/hydrating-treatment-lotion-100ml.jpg" },
      { "id": 31, "brand": "Maxylook", "name": "Deep Restructuring A+B Lotion", "line": "PROTEINS & MINERALS OF EGG", "desc": "Professional maxylook product", "price": 14398.9846, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/728-home_default/ab-intense-restructuring-lotion.jpg" },
      { "id": 32, "brand": "Maxylook", "name": "FILLER Reconstructing Fluid 100ml", "line": "N &bull; FACTOR", "desc": "Professional maxylook product", "price": 9239.230000000001, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/685-home_default/filler-reconstructing-fluid-100ml.jpg" },
      { "id": 33, "brand": "Maxylook", "name": "EXTENDER Maintenance Cream 100ml", "line": "N &bull; FACTOR", "desc": "Professional maxylook product", "price": 26296.269999999997, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/686-home_default/extender-maintenance-cream-100ml.jpg" },
      { "id": 34, "brand": "Maxylook", "name": "FORTIFIER Strengthening Cream For Wet Hair 250ml", "line": "N &bull; FACTOR", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/689-home_default/fortifier-strengthening-cream-for-wet-hair-100ml.jpg" },
      { "id": 35, "brand": "Maxylook", "name": "N&bull;Factor Kit", "line": "N &bull; FACTOR", "desc": "Professional maxylook product", "price": 55463.8084, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/701-home_default/kit-nfactor-con-box.jpg" },
      { "id": 36, "brand": "Maxylook", "name": "Revitalizing Treatment Lotion 7ml x 12", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 30134.104000000003, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/719-home_default/revitalizing-treatment-lotion-7ml-x-12.jpg" },
      { "id": 37, "brand": "Maxylook", "name": "Revitalizing Treatment Lotion 100ml", "line": "FRESH MINT", "desc": "Professional maxylook product", "price": 24803.779, "currency": "PKR", "cat": "Treatment", "badge": "", "rating": 5, "img": "https://www.maxylook.it/720-home_default/revitalizing-treatment-lotion-100ml.jpg" },
      { "id": 38, "brand": "Maxylook", "name": "Hydrating Crystal Fluid (Hydrating Crystal) 100ml", "line": "MACADAMIA", "desc": "Professional maxylook product", "price": 17696.678999999996, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/714-home_default/hydrating-crystal-fluid-hydrating-crystal-100ml.jpg" },
      { "id": 39, "brand": "Maxylook", "name": "Curl Control Cream 100 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 20752.732, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/726-home_default/curl-control-cream-100-ml.jpg" },
      { "id": 40, "brand": "Maxylook", "name": "Extreme Mousse 250 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 13261.848599999998, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/752-home_default/extreme-mousse-250-ml.jpg" },
      { "id": 41, "brand": "Maxylook", "name": "Extreme Liss Cream 100 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 20752.732, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/725-home_default/extreme-liss-cream-100-ml.jpg" },
      { "id": 42, "brand": "Maxylook", "name": "Heat Protector Spray 150 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 32522.089599999996, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/724-home_default/heat-protector-spray-150-ml.jpg" },
      { "id": 43, "brand": "Maxylook", "name": "Extreme Glossy Spray 115 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 32522.089599999996, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/723-home_default/extreme-glossy-spray-115-ml.jpg" },
      { "id": 44, "brand": "Maxylook", "name": "Extreme Hair Spray 300 ml", "line": "MAXY STYLE", "desc": "Professional maxylook product", "price": 20752.732, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/753-home_default/extreme-hair-spray-300-ml.jpg" },
      { "id": 45, "brand": "Maxylook", "name": "Instant Repair Leave-in Oil 100 ml", "line": "ARGANWAY", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/749-home_default/instant-repair-leave-in-oil-100-ml.jpg" },
      { "id": 46, "brand": "Maxylook", "name": "Protective Shining Spray 125 ml", "line": "ARGANWAY", "desc": "Professional maxylook product", "price": 32266.233999999997, "currency": "PKR", "cat": "Styling-finish", "badge": "", "rating": 5, "img": "https://www.maxylook.it/751-home_default/protective-shining-spray-125-ml.jpg" },
      { "id": 47, "brand": "Maxylook", "name": "Direct Coloring Yellow", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 14853.839, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/740-home_default/direct-coloring-yellow.jpg" },
      { "id": 48, "brand": "Maxylook", "name": "Direct Coloring Turquoise", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 13261.848599999998, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/738-home_default/direct-coloring-turquoise.jpg" },
      { "id": 49, "brand": "Maxylook", "name": "Direct Coloring Red", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/741-home_default/direct-coloring-red.jpg" },
      { "id": 50, "brand": "Maxylook", "name": "Direct Coloring Plum", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/737-home_default/direct-coloring-plum.jpg" },
      { "id": 51, "brand": "Maxylook", "name": "Direct Coloring Pink", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/736-home_default/direct-coloring-pink.jpg" },
      { "id": 52, "brand": "Maxylook", "name": "Direct Coloring Pearl Grey", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 13261.848599999998, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/742-home_default/direct-coloring-pearl-grey.jpg" },
      { "id": 53, "brand": "Maxylook", "name": "Direct Coloring Orange", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 13261.848599999998, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/739-home_default/direct-coloring-orange.jpg" },
      { "id": 54, "brand": "Maxylook", "name": "Direct Coloring Green", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/734-home_default/direct-coloring-green.jpg" },
      { "id": 55, "brand": "Maxylook", "name": "Direct Coloring Ethereal White", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/744-home_default/direct-coloring-ethereal-white.jpg" },
      { "id": 56, "brand": "Maxylook", "name": "Direct Coloring Clear", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/743-home_default/direct-coloring-clear.jpg" },
      { "id": 57, "brand": "Maxylook", "name": "Direct Coloring Blue", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7107.099999999999, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/733-home_default/direct-coloring-acid-blue.jpg" },
      { "id": 58, "brand": "Maxylook", "name": "Direct Coloring Acid Green", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 25727.702000000005, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/735-home_default/direct-coloring-acid-green.jpg" },
      { "id": 59, "brand": "Maxylook", "name": "Perfumed Oxidizing Emulsion Cream 10 volumi", "line": "Ossigeni", "desc": "Professional maxylook product", "price": 11556.144600000001, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/547-home_default/perfumed-oxidizing-emulsion-cream.jpg" },
      { "id": 60, "brand": "Maxylook", "name": "Perfumed Oxidizing Emulsion Cream 20 volumi", "line": "Ossigeni", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/548-home_default/perfumed-oxidizing-emulsion-cream-20-volumi.jpg" },
      { "id": 61, "brand": "Maxylook", "name": "Perfumed Oxidizing Emulsion Cream 30 volumi", "line": "Ossigeni", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/550-home_default/perfumed-oxidizing-emulsion-cream-30-volumi.jpg" },
      { "id": 62, "brand": "Maxylook", "name": "Perfumed Oxidizing Emulsion Cream 40 volumi", "line": "Ossigeni", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/552-home_default/perfumed-oxidizing-emulsion-cream-40-volumi.jpg" },
      { "id": 63, "brand": "Maxylook", "name": "6.34 Biondo Scuro Dorato Rame 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 7931.5236, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/340-home_default/n634-biondo-scuro-dorato-rame-100-ml.jpg" },
      { "id": 64, "brand": "Maxylook", "name": "1 Nero 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 6751.745, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/201-home_default/n1-nero-100-ml.jpg" },
      { "id": 65, "brand": "Maxylook", "name": "3 Castano Scuro 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/205-home_default/n3-castano-scuro-100-ml.jpg" },
      { "id": 66, "brand": "Maxylook", "name": "4 Castano 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/207-home_default/n4-castano-100-ml.jpg" },
      { "id": 67, "brand": "Maxylook", "name": "5 Castano Chiaro 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/211-home_default/n5-castano-chiaro-100-ml.jpg" },
      { "id": 68, "brand": "Maxylook", "name": "6 Biondo Scuro 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/210-home_default/n6-biondo-scuro-100-ml.jpg" },
      { "id": 69, "brand": "Maxylook", "name": "7 Biondo 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/213-home_default/n7-biondo-100-ml.jpg" },
      { "id": 70, "brand": "Maxylook", "name": "8 Biondo Chiaro 100 ml", "line": "HARMONIC COLOR", "desc": "Professional maxylook product", "price": 21946.724799999996, "currency": "PKR", "cat": "P-colori-diretti", "badge": "", "rating": 5, "img": "https://www.maxylook.it/216-home_default/n8-biondo-chiaro-100-ml.jpg" },
      { "id": 100, "brand": "Genus", "name": "Repairing Treatment Leave-In", "line": "24/7", "desc": "Professional Genus product from the 24/7 line.", "price": 19160.741599999998, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2024/01/Genus_Perpetual_24-7-Ok.jpg" },
      { "id": 101, "brand": "Genus", "name": "Hydrating Shampoo", "line": "Argan", "desc": "Professional Genus product from the Argan line.", "price": 13688.2746, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/ArganNo-BKG.png" },
      { "id": 102, "brand": "Genus", "name": "Hydrating Mask", "line": "Argan", "desc": "Professional Genus product from the Argan line.", "price": 7931.5236, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Argan-copyNo-BKG.png" },
      { "id": 103, "brand": "Genus", "name": "Multi-Action Leave-In Mask", "line": "Argan", "desc": "Professional Genus product from the Argan line.", "price": 16872.2554, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Argan-copy-2.png" },
      { "id": 104, "brand": "Genus", "name": "Moisturizing Serum", "line": "Argan", "desc": "Professional Genus product from the Argan line.", "price": 17170.7536, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Argan-copy-3No-BKG.png" },
      { "id": 105, "brand": "Genus", "name": "Sebum Regulating Shampoo", "line": "Balance", "desc": "Professional Genus product from the Balance line.", "price": 14853.839, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/BalanceNo-BKG.png" },
      { "id": 106, "brand": "Genus", "name": "Energizing Shampoo", "line": "Energy", "desc": "Professional Genus product from the Energy line.", "price": 7817.8099999999995, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/EnergyNo-BKG.png" },
      { "id": 107, "brand": "Genus", "name": "Reinforcing Clay Mask", "line": "Energy", "desc": "Professional Genus product from the Energy line.", "price": 19828.809, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Energy-copyNo-BKG.png" },
      { "id": 108, "brand": "Genus", "name": "Energizing Lotion", "line": "Energy", "desc": "Professional Genus product from the Energy line.", "price": 14398.9846, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Energy-copy-2No-BKG.png" },
      { "id": 109, "brand": "Genus", "name": "Energizing Lotion With Cren", "line": "Energy", "desc": "Professional Genus product from the Energy line.", "price": 14398.9846, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Energy-copy-3No-BKG.png" },
      { "id": 110, "brand": "Genus", "name": "Revitalizing Shampoo", "line": "Garlic", "desc": "Professional Genus product from the Garlic line.", "price": 14143.128999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/GarlicNo-BKG.png" },
      { "id": 111, "brand": "Genus", "name": "Revitalizing Mask", "line": "Garlic", "desc": "Professional Genus product from the Garlic line.", "price": 8812.804, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Garlic-copyNo-BKG.png" },
      { "id": 112, "brand": "Genus", "name": "Color Protection Shampoo", "line": "Hyaluronic", "desc": "Professional Genus product from the Hyaluronic line.", "price": 7391.384, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/HyaluronicNo-BKG.png" },
      { "id": 113, "brand": "Genus", "name": "Color Protection Mask", "line": "Hyaluronic", "desc": "Professional Genus product from the Hyaluronic line.", "price": 8457.448999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Hyaluronic-copyNo-BKG.png" },
      { "id": 114, "brand": "Genus", "name": "Color Protection Conditioner", "line": "Hyaluronic", "desc": "Professional Genus product from the Hyaluronic line.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Hyaluronic-copy-2No-BKG.png" },
      { "id": 115, "brand": "Genus", "name": "Color Sealing Cream", "line": "Hyaluronic", "desc": "Professional Genus product from the Hyaluronic line.", "price": 12721.708999999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Hyaluronic-copy-3No-BKG.png" },
      { "id": 116, "brand": "Genus", "name": "Intense Restoring Shampoo", "line": "Intense Restoring", "desc": "Professional Genus product from the Intense Restoring line.", "price": 8997.5886, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Intense-restoringNo-BKG.png" },
      { "id": 117, "brand": "Genus", "name": "Intense Restoring Fluid Oil", "line": "Intense Restoring", "desc": "Professional Genus product from the Intense Restoring line.", "price": 21790.368599999994, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Intense-restoring-copyNo-BKG.png" },
      { "id": 118, "brand": "Genus", "name": "Intense Restoring Mask", "line": "Intense Restoring", "desc": "Professional Genus product from the Intense Restoring line.", "price": 13617.203599999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Intense-restoring-copy-2No-BKG.png" },
      { "id": 119, "brand": "Genus", "name": "Intense Restoring Lotion", "line": "Intense Restoring", "desc": "Professional Genus product from the Intense Restoring line.", "price": 28897.468599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Intense-restoring-copy-3No-BKG.png" },
      { "id": 120, "brand": "Genus", "name": "Restructuring Shampoo", "line": "Keratin", "desc": "Professional Genus product from the Keratin line.", "price": 7391.384, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/KeratinNo-BKG.png" },
      { "id": 121, "brand": "Genus", "name": "Restructuring Mask", "line": "Keratin", "desc": "Professional Genus product from the Keratin line.", "price": 8457.448999999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Keratin-copy-4No-BKG.png" },
      { "id": 122, "brand": "Genus", "name": "Anti-Frizz Restructuring Cream", "line": "Keratin", "desc": "Professional Genus product from the Keratin line.", "price": 10845.4346, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Keratin-copy-5No-BKG.png" },
      { "id": 123, "brand": "Genus", "name": "Restructuring Leave-In Lotion", "line": "Keratin", "desc": "Professional Genus product from the Keratin line.", "price": 14398.9846, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Keratin-copy-6No-BKG.png" },
      { "id": 124, "brand": "Genus", "name": "Restructuring Treatment For Split Ends", "line": "Keratin", "desc": "Professional Genus product from the Keratin line.", "price": 16275.258999999998, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Keratin-copy-7No-BKG.png" },
      { "id": 125, "brand": "Genus", "name": "Supreme Filmer Treatment", "line": "Laminescent", "desc": "Professional Genus product from the Laminescent line.", "price": 20440.0196, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Filmer.jpg" },
      { "id": 126, "brand": "Genus", "name": "Supreme Filmer Spray", "line": "Laminescent", "desc": "Professional Genus product from the Laminescent line.", "price": 14569.554999999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Spray.jpg" },
      { "id": 127, "brand": "Genus", "name": "Nourishing Shampoo", "line": "Milk", "desc": "Professional Genus product from the Milk line.", "price": 12266.8546, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/MilkNo-BKG.png" },
      { "id": 128, "brand": "Genus", "name": "Nourishing Mask", "line": "Milk", "desc": "Professional Genus product from the Milk line.", "price": 11726.715, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Milk-copyNo-BKG.png" },
      { "id": 129, "brand": "Genus", "name": "Shampoo Ice Effect", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 14143.128999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/GenUs-Shampoo-ExtraSilver-due-formati.png" },
      { "id": 130, "brand": "Genus", "name": "Maschera Ice Effect", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 59813.353599999995, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/genUS_Extra-Silver-Mask-300-ml-2.png" },
      { "id": 131, "brand": "Genus", "name": "Mousse Ice Effect", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 15038.623599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/genUS_-Extra-Silver-mousse-200ml-1.png" },
      { "id": 132, "brand": "Genus", "name": "Silky Cream Ice Effect", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 15038.623599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/genUS_Extra-Silver-Silky-Cream-150-ml-1.png" },
      { "id": 133, "brand": "Genus", "name": "Extra Silver Treatment For Fine  Hair", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 19160.741599999998, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/genUS_Extra-Silver-Silky-Cream-150-ml-1.png" },
      { "id": 134, "brand": "Genus", "name": "Extra Silver Treatment For Thick Hair", "line": "Extra Silver", "desc": "Professional Genus product from the Extra Silver line.", "price": 19160.741599999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2025/02/genUS_Extra-Silver-Silky-Cream-150-ml-1.png" },
      { "id": 135, "brand": "Genus", "name": "Purifying Shampoo", "line": "Purity", "desc": "Professional Genus product from the Purity line.", "price": 7817.8099999999995, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/PurityNo-BKG.png" },
      { "id": 136, "brand": "Genus", "name": "Shampoo Silver", "line": "Silver", "desc": "Professional Genus product from the Silver line.", "price": 8286.8786, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2023/12/Color-copy-3No-BKG.png" },
      { "id": 137, "brand": "Genus", "name": "Curl Reactivating Spray", "line": "Seet Curls", "desc": "Professional Genus product from the Seet Curls line.", "price": 13261.848599999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2026/05/genUS_Supreme-Curl-Reactivator-150-ml-2.png" },
      { "id": 138, "brand": "Genus", "name": "Mongongo Oil", "line": "Seet Curls", "desc": "Professional Genus product from the Seet Curls line.", "price": 19231.8126, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2026/05/Mongongo.jpg" },
      { "id": 139, "brand": "Genus", "name": "Linseed Oil", "line": "Seet Curls", "desc": "Professional Genus product from the Seet Curls line.", "price": 19231.8126, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2026/05/Lino.jpg" },
      { "id": 140, "brand": "Genus", "name": "Camelina Oil", "line": "Seet Curls", "desc": "Professional Genus product from the Seet Curls line.", "price": 19231.8126, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2026/05/Camelina.jpg" },
      { "id": 141, "brand": "Genus", "name": "Watch The Videoredefine Your Curls In A Single Gesture", "line": "Seet Curls", "desc": "Professional Genus product from the Seet Curls line.", "price": 11556.144600000001, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://genushair.com/wp-content/uploads/2026/05/Camelina.jpg" },
      { "id": 200, "brand": "Versum", "name": "Et 1024X593", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Et-1024x593.jpg" },
      { "id": 201, "brand": "Versum", "name": "Easy Color", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 6751.745, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Color.png" },
      { "id": 202, "brand": "Versum", "name": "Easy Oxy", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 7931.5236, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Oxy.png" },
      { "id": 203, "brand": "Versum", "name": "Easy Color Ammonia Free", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 12266.8546, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Color-Ammonia-Free.png" },
      { "id": 204, "brand": "Versum", "name": "Easy Oxy Compact", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Oxy-Compact.png" },
      { "id": 205, "brand": "Versum", "name": "Easy Blonde 9 Tones", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 36246.21, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Blonde-9-tones.png" },
      { "id": 206, "brand": "Versum", "name": "Easy Blonde Blue Powder", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Blonde-Blue-Powder.png" },
      { "id": 207, "brand": "Versum", "name": "Easy Blond White Powder", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Blond-White-Powder.png" },
      { "id": 208, "brand": "Versum", "name": "Easy Blonde Violet", "line": "Easy Color", "desc": "Professional Versum product from the Easy Color line.", "price": 14853.839, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Blonde-Violet.png" },
      { "id": 209, "brand": "Versum", "name": "Gt 1024X593", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/gt-1024x593.jpg" },
      { "id": 210, "brand": "Versum", "name": "Gradient Tone Silver", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Silver.png" },
      { "id": 211, "brand": "Versum", "name": "Gradient Tone Violet", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 14853.839, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Violet.png" },
      { "id": 212, "brand": "Versum", "name": "Gradient Tone Red", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Red.png" },
      { "id": 213, "brand": "Versum", "name": "Gradient Tone Caramel", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 13261.848599999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Caramel.png" },
      { "id": 214, "brand": "Versum", "name": "Gradient Tone Copper", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Copper.png" },
      { "id": 215, "brand": "Versum", "name": "Gradient Tone Black", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Black.png" },
      { "id": 216, "brand": "Versum", "name": "Gradient Tone Chocolate", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Chocolate.png" },
      { "id": 217, "brand": "Versum", "name": "Gradient Tone Beige", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Beige.png" },
      { "id": 218, "brand": "Versum", "name": "Gradient Tone Gold", "line": "Gradient Tone", "desc": "Professional Versum product from the Gradient Tone line.", "price": 18592.173600000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Gradient-Tone-Gold.png" },
      { "id": 219, "brand": "Versum", "name": "Es 1024X593", "line": "Sun Shine", "desc": "Professional Versum product from the Sun Shine line.", "price": 8528.519999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Es-1024x593.jpg" },
      { "id": 220, "brand": "Versum", "name": "Sun Shine Shampoo", "line": "Sun Shine", "desc": "Professional Versum product from the Sun Shine line.", "price": 14143.128999999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Sun-Shine-Shampoo.png" },
      { "id": 221, "brand": "Versum", "name": "Sun Shine Mask", "line": "Sun Shine", "desc": "Professional Versum product from the Sun Shine line.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Sun-Shine-Mask.png" },
      { "id": 222, "brand": "Versum", "name": "Sun Shine Solar Oil", "line": "Sun Shine", "desc": "Professional Versum product from the Sun Shine line.", "price": 19231.8126, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Sun-Shine-Solar-Oil.png" },
      { "id": 223, "brand": "Versum", "name": "Ar 1024X593", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Ar-1024x593.jpg" },
      { "id": 224, "brand": "Versum", "name": "Artis Sculpting Spray", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 8812.804, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/04/Artis-Sculpting-Spray.png" },
      { "id": 225, "brand": "Versum", "name": "Artis Supreme Shine Spray", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 32266.233999999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/04/Artis-Supreme-Shine-Spray.png" },
      { "id": 226, "brand": "Versum", "name": "Artis Weather Protector", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 15038.623599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/04/Artis-Weather-Protector.png" },
      { "id": 227, "brand": "Versum", "name": "Artis Thermal Shield Spray", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 32266.233999999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/04/Artis-Thermal-Shield-spray.png" },
      { "id": 228, "brand": "Versum", "name": "Artis Quick Texturizer", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/04/Artis-Quick-Texturizer.png" },
      { "id": 229, "brand": "Versum", "name": "Artis Bright Wax", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 21676.654999999995, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Bright-Wax.png" },
      { "id": 230, "brand": "Versum", "name": "Artis Shaping Matt Pomade", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Shaping-Matt-Pomade.png" },
      { "id": 231, "brand": "Versum", "name": "Artis Gel", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 10916.5056, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Gel.png" },
      { "id": 232, "brand": "Versum", "name": "Artis Curls Definer", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 16275.258999999998, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Curls-Definer.png" },
      { "id": 233, "brand": "Versum", "name": "Artis Strong Hold Mousse 1", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 17170.7536, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Strong-Hold-Mousse-1.png" },
      { "id": 234, "brand": "Versum", "name": "Artis Termal Protector", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 15038.623599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Termal-Protector.png" },
      { "id": 235, "brand": "Versum", "name": "Artis Total Relaxer", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Total-Relaxer.png" },
      { "id": 236, "brand": "Versum", "name": "Artis Volume Booster", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 8997.5886, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Volume-Booster.png" },
      { "id": 237, "brand": "Versum", "name": "Artis Mediterranean Oil", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 19231.8126, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Mediterranean-Oil.png" },
      { "id": 238, "brand": "Versum", "name": "Artis Crystal Drops", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 24448.424, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Crystal-Drops.png" },
      { "id": 239, "brand": "Versum", "name": "Artis Polishing Spray", "line": "Artis", "desc": "Professional Versum product from the Artis line.", "price": 8812.804, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Artis-Polishing-Spray.png" },
      { "id": 240, "brand": "Versum", "name": "Tk 1024X593", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/tk-1024x593.jpg" },
      { "id": 241, "brand": "Versum", "name": "Charcoal Detox Peeling", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Charcoal-Detox-Peeling.png" },
      { "id": 242, "brand": "Versum", "name": "Charcoal Detox Shampoo 1", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 14853.839, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Charcoal-Detox-Shampoo-1.png" },
      { "id": 243, "brand": "Versum", "name": "Charcoal Detox Mask", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 11300.288999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Charcoal-Detox-Mask.png" },
      { "id": 244, "brand": "Versum", "name": "Trikology Reinforcing Shampoo", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 26296.269999999997, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Trikology_Reinforcing-Shampoo.png" },
      { "id": 245, "brand": "Versum", "name": "Trikology Reinforcing Lotion", "line": "Trikology", "desc": "Professional Versum product from the Trikology line.", "price": 36175.138999999996, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Trikology_Reinforcing-Lotion.png" },
      { "id": 246, "brand": "Versum", "name": "Elmk 1024X593", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Elmk-1024x593.jpg" },
      { "id": 247, "brand": "Versum", "name": "Softening Shampoo", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 24306.282, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Softening-Shampoo.png" },
      { "id": 248, "brand": "Versum", "name": "Nourishing Mask", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 11726.715, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Nourishing-Mask.png" },
      { "id": 249, "brand": "Versum", "name": "Repairing Mask", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 16801.1844, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Repairing-Mask.png" },
      { "id": 250, "brand": "Versum", "name": "Anti Frizz Mask", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 12906.4936, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Anti-frizz-Mask.png" },
      { "id": 251, "brand": "Versum", "name": "Softening Boost", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 32522.089599999996, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Softening-Boost.png" },
      { "id": 252, "brand": "Versum", "name": "Moisturizing Shampoo", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 26225.199, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Moisturizing-Shampoo.png" },
      { "id": 253, "brand": "Versum", "name": "Moisturizing Mask", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 28001.974, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Moisturizing-Mask.png" },
      { "id": 254, "brand": "Versum", "name": "Age Defying Shampoo", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 26225.199, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Age-Defying-Shampoo.png" },
      { "id": 255, "brand": "Versum", "name": "Age Defying Mask", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 12906.4936, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Age-Defying-Mask.png" },
      { "id": 256, "brand": "Versum", "name": "Age Defying Lamellar Elixir", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 25343.918599999997, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Age-Defying-Lamellar-Elixir.png" },
      { "id": 257, "brand": "Versum", "name": "Trifasico", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Trifasico.png" },
      { "id": 258, "brand": "Versum", "name": "Multi Action 15In1", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 18052.033999999996, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Multi-action-15in1.png" },
      { "id": 259, "brand": "Versum", "name": "Conditioning Leave In Cream", "line": "Elements", "desc": "Professional Versum product from the Elements line.", "price": 14398.9846, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Conditioning-Leave-in-cream.png" },
      { "id": 260, "brand": "Versum", "name": "Alchemist Shampoo", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 14143.128999999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/Alchemist_shampoo.png" },
      { "id": 261, "brand": "Versum", "name": "Treatment", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/Treatment.png" },
      { "id": 262, "brand": "Versum", "name": "Reconstructing Finalizer", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 54298.244000000006, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/Reconstructing-Finalizer.png" },
      { "id": 263, "brand": "Versum", "name": "Filler", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 63366.90359999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/Filler.png" },
      { "id": 264, "brand": "Versum", "name": "Pink Foam", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 7107.099999999999, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/Pink-Foam.png" },
      { "id": 265, "brand": "Versum", "name": "B Tech", "line": "Alchemist", "desc": "Professional Versum product from the Alchemist line.", "price": 42258.8166, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/01/B-tech.png" },
      { "id": 266, "brand": "Versum", "name": "Est 1024X593", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 22.5, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Est-1024x593.jpg" },
      { "id": 267, "brand": "Versum", "name": "Easy Tech Advance Extra Silver", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 8286.8786, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Extra-Silver.png" },
      { "id": 268, "brand": "Versum", "name": "Easy Tech Advance Performing Shampoo", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Performing-Shampoo.png" },
      { "id": 269, "brand": "Versum", "name": "Easy Tech Advance Performing Mask", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Performing-Mask.png" },
      { "id": 270, "brand": "Versum", "name": "Easy Tech Advance Preparing Shampoo", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Preparing-Shampoo.png" },
      { "id": 271, "brand": "Versum", "name": "Easy Tech Advance Maintaining Shampoo", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Maintaining-Shampoo.png" },
      { "id": 272, "brand": "Versum", "name": "Easy Tech Advance Maintaining Mask", "line": "Easy Tech", "desc": "Professional Versum product from the Easy Tech line.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "new", "rating": 5, "img": "https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Tech_Advance-Maintaining-Mask.png" },
      { "id": 300, "brand": "UNA", "name": "Drop Oxygenating Scalp Treatment - UNA stop loss", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Oxygenating_Scalp_Treatment.png?v=1733155079" },
      { "id": 301, "brand": "UNA", "name": "COMPENSATING SHAMPOO- UNA Stop Loss", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "best", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Compensating_Shampoo_1000ml_copia.png?v=1733153687" },
      { "id": 302, "brand": "UNA", "name": "UNA Stop Loss Anti Hair Loss System Set: Defend and Restore for Stronger, Healthier Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13261.848599999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNAStopLossAntiHairLossSystemSet_5f66f60c-0a11-493a-98e2-a9c2142089ed.png?v=1774009868" },
      { "id": 303, "brand": "UNA", "name": "Moisturizing Hair Mask - UNA HYDRO-IN For Dry Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Moisturizing_HairMask_1000_ml.png?v=1733164422" },
      { "id": 304, "brand": "UNA", "name": "Revitalizing Hair Conditioner - UNA Fortify Energizing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 14143.128999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Revitalizing_Hair_Conditioner_1000_ML.png?v=1733179232" },
      { "id": 305, "brand": "UNA", "name": "Hydrating Shampoo -UNA  Hydro In For Dry Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13688.2746, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Hydrating-Shampoo-1000ml.png?v=1733175169" },
      { "id": 306, "brand": "UNA", "name": "DUAL-PHASE TREATMENT- UNA", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 25727.702000000005, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/IMG_5279.jpg?v=1734646733" },
      { "id": 307, "brand": "UNA", "name": "Vitamin Leave-in  Hair Treatment - UNA Post Chem", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 11556.144600000001, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Vitamin_Leave_in_Hair_Treatment.png?v=1733154282" },
      { "id": 308, "brand": "UNA", "name": "Designing Oil Non Oil - UNA FINISH Styling", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 18904.886000000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Designing-Oil-Non-Oil-250-ml.png?v=1733155428" },
      { "id": 309, "brand": "UNA", "name": "Pure Gloss Polisher - UNA Fish Styling & Defining", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 18904.886000000002, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Pure_Gloss_Polisher.png?v=1733163160" },
      { "id": 310, "brand": "UNA", "name": "lntensive Protein Hair Treatment - UNA FORTIFY - Energizing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Intensive-Protein-Treatment-250-ml.png?v=1733156194" },
      { "id": 311, "brand": "UNA", "name": "Re-Build Theraphy Mask - UNA REPAIR", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/RE-BUILD_THERAPY_MASK_1000_ml.png?v=1733166458" },
      { "id": 312, "brand": "UNA", "name": "GARLIC TREATMENT- UNA Hair Food", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 17170.7536, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/UNAGARLICTREATMENT500ML.jpg?v=1677072467" },
      { "id": 313, "brand": "UNA", "name": "FREEZING SPRAY- UNA  finish", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 25727.702000000005, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/freezingspray.png?v=1680033667" },
      { "id": 314, "brand": "UNA", "name": "COCONUT OIL HAIR MASK - UNA ETNIKA", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Coconut_Oil_Hair_Mask_1000_ml_copia.png?v=1733156495" },
      { "id": 315, "brand": "UNA", "name": "Vials Restructurizing treatment - UNA FORTIFY I Energizing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Reconstructing_Hair_Treatment_12_ml_copia.png?v=1733164138" },
      { "id": 316, "brand": "UNA", "name": "Daily Hydro Active Hair Conditioner - UNA  Daily Cure", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13261.848599999998, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Daily-Hair-Conditioner-1000ml.png?v=1733156849" },
      { "id": 317, "brand": "UNA", "name": "Drop Restructurizing Hair Treatment - UNA FORTIFY Energizing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Restrueturizing_Hair_Treatment.png?v=1733173990" },
      { "id": 318, "brand": "UNA", "name": "VITAMINS HAIR TREATMENT- MOISTURIZING MASK- UNA hair food", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/1170665017_23029d5a-f104-44a2-9147-c76b415560e4.jpg?v=1673048844" },
      { "id": 319, "brand": "UNA", "name": "Silker - UNA FINISH Styling & Defining", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 16744.327599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Silker_FINISH_Styling_Defining.png?v=1733157417" },
      { "id": 320, "brand": "UNA", "name": "OXYGENATING TREATMENT- UNA stop loss 12 vials", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/OXYGENATING_TREATMENT_VIALS.png?v=1733174193" },
      { "id": 321, "brand": "UNA", "name": "Energizing shampoo - UNA FORTIFY Energizing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13688.2746, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Energizing-Shampoo-1000ml.png?v=1733163875" },
      { "id": 322, "brand": "UNA", "name": "Hair Detangler - UNA Hydro In For Dry Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 11556.144600000001, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Hair-Detangler-250-ml.png?v=1733164741" },
      { "id": 323, "brand": "UNA", "name": "SPRAY SHINE - UNA  finish", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 32266.233999999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/UNA_FINISH_sprayshine_flac150ml.jpg?v=1680031224" },
      { "id": 324, "brand": "UNA", "name": "ACID CONDITIONER 1000ML - UNA", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 15564.548999999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/ACIDCONDITIONER1000ML-UNA.jpg?v=1706644251" },
      { "id": 325, "brand": "UNA", "name": "JOJOBA OIL HAIR MASK- UNA Hair Food", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/IMG_0742.jpg?v=1679674430" },
      { "id": 326, "brand": "UNA", "name": "PROTEIN HAIR TREATMENT NOURISHING MASK- UNA Hair Food", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/IMG_0745.jpg?v=1679674491" },
      { "id": 327, "brand": "UNA", "name": "Neutralizing  Shampoo - UNA  Post Chem Chemieally Treated Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13688.2746, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/NEUTRALIZING_SHAMPOO_1000_ml.png?v=1733163602" },
      { "id": 328, "brand": "UNA", "name": "Acid Hair Conditioner - UNA  Post Chem Chemieally Treated Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 7107.099999999999, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Una_Acid-Hair-Conditioner-1000-ml.png?v=1733180002" },
      { "id": 329, "brand": "UNA", "name": "MOISTURIZING OIL HAIR TREATMENT- UNA Hydro", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 30134.104000000003, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/MOISTURIZINGOILHAIRTREATMENT.jpg?v=1679672859" },
      { "id": 330, "brand": "UNA", "name": "SESAME OIL HAIR MASK-UNA  Hair Food", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13858.845, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/SESAMEOILHAIRMASK1000ml.jpg?v=1679518360" },
      { "id": 331, "brand": "UNA", "name": "DAILY GENTLE SHAMPOO- UNA Daily Cure", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 7036.029, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/DailyGentleShampoo1000ml.jpg?v=1679349387" },
      { "id": 332, "brand": "UNA", "name": "NORMALIZING TREATMENT- UNA Balancing", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 16744.327599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/NORMALIZINGTREATMENTBOX12.png?v=1679672435" },
      { "id": 333, "brand": "UNA", "name": "Purifying Shampoo - UNA Pure Purifying", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 13688.2746, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Purifying_Shampoo_1000_ML.png?v=1733177011" },
      { "id": 334, "brand": "UNA", "name": "UNA Balancing Kit for Oily Skin and Hair", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 81035.1542, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNABalancingKitforOilySkinandHair.png?v=1706729212" },
      { "id": 335, "brand": "UNA", "name": "UNA Restoration Radiance Kit: Transforming Damaged Tresses to Brilliance", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 81035.1542, "currency": "PKR", "cat": "Product", "badge": "sale", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNAFortifyingEnergizingSystemSetFortifyingEnergizingSystemSet.jpg?v=1721228316" },
      { "id": 336, "brand": "UNA", "name": "UNA Hydro-In Dry and Frizzy Hair Set", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 11556.144600000001, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNAHydro-InDryandFrizzyHairSet.png?v=1706729335" },
      { "id": 337, "brand": "UNA", "name": "UNA Pre/Post Technical Services Set", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 16744.327599999997, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNAPrePostTechnicalServicesSet.jpg?v=1721226046" },
      { "id": 338, "brand": "UNA", "name": "UNA Daily Treatments Set", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 25727.702000000005, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/files/UNADailyTreatmentsSet.jpg?v=1721223960" },
      { "id": 339, "brand": "UNA", "name": "SCULPTING GLAZE- UNA styling", "line": "Rolland", "desc": "Professional UNA Rolland USA product.", "price": 25727.702000000005, "currency": "PKR", "cat": "Product", "badge": "", "rating": 5, "img": "https://cdn.shopify.com/s/files/1/0326/9541/9016/products/SCULPTINGGLAZE250ml.jpg?v=1679519534" }

    ];

    const fallbackTestimonials = [
      { id: 1, name: 'Sara Ahmed', role: 'Salon Owner', text: 'I\'ve been using Maxylook products in my salon for years. The quality is unmatched — my clients notice the difference immediately.', rating: 5, avatar: 'SA' },
      { id: 2, name: 'Fatima Khan', role: 'Beauty Enthusiast', text: 'The Versum Hydrator line transformed my dry, damaged hair. After just two weeks, it feels like I stepped out of a high-end salon.', rating: 5, avatar: 'FK' },
      { id: 3, name: 'Ayesha Malik', role: 'Professional Stylist', text: 'Italia Cosmetics delivers authentic Italian products faster than any distributor I\'ve worked with. Genus Argan line is my go-to for color-treated hair.', rating: 5, avatar: 'AM' },
    ];

    const fallbackBrands = [
      { id: 'mx', name: 'Maxylook', gradient: 'linear-gradient(135deg,#8B5FBF,#A07DD6)', desc: 'Superfood-powered Italian haircare — Collagen, Macadamia, Argan, and Protein lines that nourish the hair ecosystem.', textColor: '#fff', img: 'https://www.maxylook.it/612-home_default/hydrating-shampoo-1000-ml.jpg' },
      { id: 'gn', name: 'Genus', gradient: 'linear-gradient(135deg,#232323,#3A3A3A)', desc: 'Global professional haircare with targeted solutions: Argan, Keratin, Hyaluronic, Milk, and Energy lines for every need.', textColor: '#fff', img: 'https://genushair.com/wp-content/uploads/2023/12/ArganNo-BKG.png' },
      { id: 'vs', name: 'Versum', gradient: 'linear-gradient(135deg,#D4AF37,#E8C84A)', desc: 'Where science meets beauty — advanced lamellar technology, charcoal detox, age-defying elixirs, and artis styling.', textColor: '#232323', img: 'https://www.versumhair.com/wp-content/uploads/2026/03/Easy-Color.png' },
      { id: 'una', name: 'UNA', gradient: 'linear-gradient(135deg,#F37AA2,#E05A86)', desc: 'High-performance professional treatments — anti-hair loss systems, deep repair, intense hydration, and specialty therapies.', textColor: '#fff', img: 'https://cdn.shopify.com/s/files/1/0326/9541/9016/files/Oxygenating_Scalp_Treatment.png?v=1733155079' },
    ];

    const fallbackBlogPosts = [
      { id: 1, title: 'The Ultimate Guide to Professional Hair Masks', content: '<p>Not all hair masks are created equal. From collagen-infused treatments to protein-rich formulas, discover which mask is right for your hair type and concerns. A good hair mask should penetrate the cuticle deeply and repair from within. We recommend using heat to open the cuticle for maximum absorption.</p>', date: 'Jun 28, 2026', author: 'Italia Team', cat: 'Shampoo', excerpt: 'Not all hair masks are created equal. From collagen-infused treatments to protein-rich formulas, discover which mask is right for your hair type and concerns.', gradient: 'linear-gradient(135deg,var(--purple),var(--purple-dark))', icon: 'fa-wind' },
      { id: 2, title: 'Versum Hair 2.0: A New Era in Haircare Science', content: '<p>We dive deep into the revolutionary lamellar technology behind Versum\'s new line. Age-defying elixirs, charcoal detox, and the science of beautiful hair. Lamellar water is a breakthrough that targets only the damaged areas of the hair, delivering instant shine without weighing it down.</p>', date: 'Jun 15, 2026', author: 'Italia Team', cat: 'Mask', excerpt: 'We dive deep into the revolutionary lamellar technology behind Versum\'s new line. Age-defying elixirs, charcoal detox, and the science of beautiful hair.', gradient: 'linear-gradient(135deg,var(--pink),var(--pink-dark))', icon: 'fa-oil-can' },
      { id: 3, title: 'Superfoods for Your Hair: The Maxylook Philosophy', content: '<p>Collagen, Macadamia, Argan, Quinoa Protein — how superfood ingredients are transforming professional haircare and why your hair needs them. These ingredients provide essential fatty acids, antioxidants, and vitamins that fortify the hair follicle and protect against environmental stress.</p>', date: 'Jun 2, 2026', author: 'Italia Team', cat: 'Treatment', excerpt: 'Collagen, Macadamia, Argan, Quinoa Protein — how superfood ingredients are transforming professional haircare and why your hair needs them.', gradient: 'linear-gradient(135deg,var(--gold),var(--gold-light))', icon: 'fa-leaf' },
      { id: 4, title: 'How to Build a Professional Hair Care Routine', content: '<p>Step-by-step guide to creating a salon-grade haircare routine at home. From cleansing to treatment to styling — what professionals recommend. First, clarify once a month. Second, always use a conditioner after a mask to seal the cuticle. Third, never skip heat protection!</p>', date: 'May 20, 2026', author: 'Italia Team', cat: 'Serum', excerpt: 'Step-by-step guide to creating a salon-grade haircare routine at home. From cleansing to treatment to styling — what professionals recommend.', gradient: 'linear-gradient(135deg,var(--charcoal),var(--charcoal-soft))', icon: 'fa-shield-alt' },
    ];

    // Active product data (starts as copy of fallback, replaced by WP fetch)
    let products = [...fallbackProducts];

    // ==================== CART ====================
    let cart = [];

    function loadCart() {
      try {
        const saved = localStorage.getItem('italia_cart');
        if (saved) cart = JSON.parse(saved);
      } catch(e) {}
    }

    function saveCart() {
      localStorage.setItem('italia_cart', JSON.stringify(cart));
    }

    function addToCart(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: p.id, name: p.name, brand: p.brand, price: p.price, currency: p.currency, img: p.img, qty: 1 });
      }
      saveCart();
      updateCartUI();
      showToast(p.name + ' added to cart!');
    }

    function removeFromCart(id) {
      cart = cart.filter(item => item.id !== id);
      saveCart();
      updateCartUI();
    }

    function updateCartQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
      }
      saveCart();
      updateCartUI();
    }

    function getCartTotal() {
      return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    function getCartCount() {
      return cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function toggleCart() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      const open = drawer.classList.toggle('open');
      overlay.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) renderCartDrawer();
    }

    function renderCartDrawer() {
      const container = document.getElementById('cartItems');
      const empty = document.getElementById('cartEmpty');
      const footer = document.getElementById('cartFooter');
      const totalEl = document.getElementById('cartTotal');

      if (!cart.length) {
        container.innerHTML = '<div class="cart-drawer-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>';
        footer.style.display = 'none';
        return;
      }

      container.innerHTML = cart.map(item => `
        <div class="cart-drawer-item">
          <div class="cart-item-img">
            ${item.img ? `<img src="${item.img}" alt="${item.name}">` : '<i class="fas fa-gift"></i>'}
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-brand">${item.brand}</div>
            <div class="cart-item-price">${item.currency} ${(item.price * item.qty).toFixed(2)}</div>
            <div class="cart-item-actions">
              <button class="cart-qty-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
              <span class="cart-qty">${item.qty}</span>
              <button class="cart-qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
              <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        </div>
      `).join('');

      footer.style.display = 'block';
      const curr = cart[0]?.currency || 'PKR';
      totalEl.textContent = curr + ' ' + getCartTotal().toFixed(0);
    }

    function updateCartUI() {
      const count = getCartCount();
      document.getElementById('cartCount').textContent = count;
      if (document.getElementById('cartDrawer').classList.contains('open')) renderCartDrawer();
      const chkPage = document.getElementById('page-checkout');
      if (chkPage && chkPage.classList.contains('active')) renderCheckout();
    }

    // ==================== WISHLIST ====================
    let wishlist = [];

    function loadWishlist() {
      try { const saved = localStorage.getItem('italia_wishlist'); if (saved) wishlist = JSON.parse(saved); } catch(e) {}
    }

    function saveWishlist() {
      localStorage.setItem('italia_wishlist', JSON.stringify(wishlist));
      updateWishlistUI();
    }

    function toggleWishlistItem(id) {
      const idx = wishlist.indexOf(id);
      if (idx > -1) { wishlist.splice(idx, 1); showToast('Removed from wishlist'); }
      else { wishlist.push(id); showToast('Added to wishlist!'); }
      saveWishlist();
    }

    function isInWishlist(id) { return wishlist.includes(id); }

    function getWishlistProducts() { return products.filter(p => wishlist.includes(p.id)); }

    function toggleWishlist() {
      const overlay = document.getElementById('wishlistOverlay');
      const drawer = document.getElementById('wishlistDrawer');
      overlay.classList.toggle('open');
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) renderWishlistDrawer();
    }

    function updateWishlistUI() {
      const count = wishlist.length;
      const el = document.getElementById('wishlistCount');
      if (el) { el.textContent = count; el.style.display = count ? 'flex' : 'none'; }
    }

    function renderWishlistDrawer() {
      const container = document.getElementById('wishlistItems');
      const footer = document.getElementById('wishlistFooter');
      document.getElementById('wishlistCountTitle').textContent = wishlist.length;
      if (!wishlist.length) {
        container.innerHTML = '<div class="cart-drawer-empty"><i class="far fa-heart"></i><p>Your wishlist is empty</p></div>';
        footer.style.display = 'none';
        return;
      }
      const wishProducts = getWishlistProducts();
      container.innerHTML = wishProducts.map(item => `
        <div class="cart-drawer-item">
          <div class="cart-item-img">${item.img ? `<img src="${item.img}" alt="${item.name}">` : `<i class="fas fa-gift"></i>`}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-brand">${item.brand}</div>
            <div class="cart-item-price">${item.currency} ${item.price.toFixed(2)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <button class="cart-item-remove" onclick="toggleWishlistItem(${item.id});renderWishlistDrawer()" title="Remove"><i class="fas fa-trash-alt"></i></button>
            <button class="cart-qty-btn" onclick="addToCart(${item.id});showToast('Added to cart!')" title="Add to cart"><i class="fas fa-shopping-bag"></i></button>
          </div>
        </div>
      `).join('');
      footer.style.display = 'block';
    }

    // ==================== SEARCH ====================
    let searchTimeout;

    function openSearch() {
      document.getElementById('searchOverlay').classList.add('open');
      document.getElementById('searchInput').value = '';
      document.getElementById('searchResults').innerHTML = '<div class="search-hint">Type at least 2 characters to search</div>';
      setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
    }

    function closeSearch(e) {
      if (e && e.target !== e.currentTarget) return;
      document.getElementById('searchOverlay').classList.remove('open');
    }

    function doSearch(query) {
      clearTimeout(searchTimeout);
      if (query.length < 2) {
        document.getElementById('searchResults').innerHTML = '<div class="search-hint">Type at least 2 characters to search</div>';
        return;
      }
      searchTimeout = setTimeout(async () => {
        const results = document.getElementById('searchResults');
        results.innerHTML = '<div class="search-hint">Searching...</div>';
        try {
          const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
          const res = await fetch(WP.wc + '/products?search=' + encodeURIComponent(query) + '&per_page=10&_fields=id,name,price,attributes,images,meta_data', {
            headers: { 'Authorization': 'Basic ' + auth }
          });
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          if (!data.length) {
            results.innerHTML = '<div class="search-hint">No products found for "' + query + '"</div>';
            return;
          }
          results.innerHTML = data.map(p => {
            const attrs = {};
            (p.attributes || []).forEach(a => { attrs[a.name.toLowerCase()] = a.options?.[0] || ''; });
            const img = p.images?.[0]?.src || (p.meta_data?.find(m => m.key === 'product_image_url')?.value) || '';
            return `<div class="search-result-item" onclick="closeSearch();navigate('shop');document.getElementById('searchOverlay').classList.remove('open')">
              ${img ? `<img src="${img}" alt="${p.name}">` : '<div style="width:48px;height:48px;background:var(--lavender);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center"><i class="fas fa-gift" style="color:var(--purple-light)"></i></div>'}
              <div class="sri-info">
                <div class="sri-name">${p.name}</div>
                <div class="sri-brand">${attrs.brand || ''}</div>
              </div>
              <div class="sri-price">PKR ${parseFloat(p.price).toLocaleString()}</div>
            </div>`;
          }).join('');
        } catch(e) {
          // fallback: search in fallbackProducts
          const local = fallbackProducts.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase()) ||
            (p.line || '').toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
          if (!local.length) {
            results.innerHTML = '<div class="search-hint">No products found</div>';
            return;
          }
          results.innerHTML = local.map(p => `
            <div class="search-result-item" onclick="closeSearch();navigate('shop');document.getElementById('searchOverlay').classList.remove('open')">
              ${p.img ? `<img src="${p.img}" alt="${p.name}">` : '<div style="width:48px;height:48px;background:var(--lavender);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center"><i class="fas fa-gift" style="color:var(--purple-light)"></i></div>'}
              <div class="sri-info">
                <div class="sri-name">${p.name}</div>
                <div class="sri-brand">${p.brand}</div>
              </div>
              <div class="sri-price">PKR ${p.price.toLocaleString()}</div>
            </div>
          `).join('');
        }
      }, 300);
    }


    // ==================== SEO / AEO ====================
    function updateMeta(title, description) {
      document.title = title + ' | Italia Cosmetics';
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }

    // ==================== NAVIGATION ====================
    let currentFilter = {};

    function getPageFromUrl() {
      const params = new URLSearchParams(location.search);
      const page = params.get('page') || location.pathname.replace(/^\//, '') || 'home';
      const id = params.get('id') || null;
      const hash = location.hash.replace('#', '');
      if (hash && page === 'home') {
        const [hp, hq] = hash.split('?');
        const hpParams = new URLSearchParams(hq || '');
        return { page: hp || 'home', id: hpParams.get('id') || null };
      }
      return { page, id };
    }

    function navigate(page, id = null) {
      const pageTitles = {
        'home': 'Premium Professional Haircare & Skincare',
        'shop': 'Shop Professional Hair Cosmetics',
        'brands': 'Our Brands (Genus, Versum, Maxylook, UNA)',
        'about': 'About Us',
        'blog': 'Beauty Blog & Tips',
        'contact': 'Contact & FAQs',
        'checkout': 'Checkout',
        'product-details': 'Product Details',
        'single-blog': 'Blog Post'
      };
      if (pageTitles[page]) {
        updateMeta(pageTitles[page], 'Discover ' + pageTitles[page] + ' at Italia Cosmetics.');
      }

      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + page);
      if (!target) { window.location.hash = ''; return false; }
      target.classList.add('active');
      document.querySelectorAll('.nav a, .mobile-nav a').forEach(a => a.classList.remove('active'));
      document.querySelectorAll('.nav a[data-page="' + page + '"], .mobile-nav a[data-page="' + page + '"]').forEach(a => a.classList.add('active'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (page === 'shop') renderShop();
      if (page === 'home') renderBestSellers();
      if (page === 'checkout') renderCheckout();
      if (page === 'brands') { if (typeof renderBrandCards === 'function' && window.wpBrands) renderBrandCards(); else fetchBrands(); }
      if (page === 'about') { if (typeof fetchAbout === 'function') fetchAbout(); }
      if (page === 'blog') { if (typeof fetchBlogPosts === 'function') fetchBlogPosts(); }
      if (page === 'contact') { if (typeof renderFaqs === 'function') renderFaqs(); }
      if (page === 'product-details' && id) { if (typeof renderProductDetails === 'function') renderProductDetails(id); }
      if (page === 'single-blog' && id) { if (typeof renderSingleBlog === 'function') renderSingleBlog(id); }
      
      let url = '/';
      if (page !== 'home' || id) {
        url = '/?page=' + page;
        if (id) url += '&id=' + id;
      }
      if (location.pathname + location.search !== url) history.pushState(null, '', url);
      return false;
    }

    window.addEventListener('popstate', () => {
      const { page, id } = getPageFromUrl();
      if (document.getElementById('page-' + page)) navigate(page, id);
    });

    // Event delegation for product card, buttons, and navigation clicks
    document.addEventListener('click', function(e) {
      const target = e.target;
      const addBtn = target.closest('[data-add-to-cart]');
      if (addBtn) { addToCart(Number(addBtn.getAttribute('data-add-to-cart'))); return; }
      const wishBtn = target.closest('[data-wishlist-toggle]');
      if (wishBtn) {
        const id = Number(wishBtn.getAttribute('data-wishlist-toggle'));
        toggleWishlistItem(id);
        const icon = wishBtn.querySelector('i');
        if (icon) icon.className = isInWishlist(id) ? 'fas fa-heart' : 'far fa-heart';
        return;
      }
      const navBtn = target.closest('[data-navigate]');
      if (navBtn) { navigate(navBtn.getAttribute('data-navigate')); return; }
      if (target.closest('button') || target.closest('.btn')) return;
      const card = target.closest('[data-product-id]');
      if (card) {
        const id = Number(card.getAttribute('data-product-id'));
        if (id) navigate('product-details', id);
      }
    });

    // Legacy hash support — convert to query param URL
    window.addEventListener('hashchange', () => {
      if (location.hash) {
        const hash = location.hash.replace('#', '');
        const [hp, hq] = hash.split('?');
        const hqp = new URLSearchParams(hq || '');
        navigate(hp || 'home', hqp.get('id'));
      }
    });

    if (location.hash && !location.search.includes('page=')) {
      const hash = location.hash.replace('#', '');
      const [hp, hq] = hash.split('?');
      const hqp = new URLSearchParams(hq || '');
      if (document.getElementById('page-' + hp)) setTimeout(() => navigate(hp || 'home', hqp.get('id')), 50);
    }

    function toggleMobileMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
    }

    function toggleShopSidebar() {
      document.getElementById('shopSidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('open');
      const closeBtn = document.querySelector('.sidebar-close-btn');
      if (closeBtn) {
        closeBtn.style.display = document.getElementById('shopSidebar').classList.contains('open') && window.innerWidth < 768 ? 'block' : 'none';
      }
    }

    function filterBrand(brand) {
      navigate('shop');
      document.querySelectorAll('#shopSidebar input[type="checkbox"]').forEach(cb => cb.checked = cb.value === brand);
      applyFilters();
    }

    function filterCategory(category) {
      navigate('shop');
      document.querySelectorAll('#shopSidebar input[type="checkbox"]').forEach(cb => cb.checked = cb.value === category);
      applyFilters();
    }

    // ==================== PRODUCT RENDERING ====================
    function renderProductCard(p, idx = 0) {
      const delayClass = 'fade-up-delay-' + ((idx % 4) + 1);
      const iconMap = {
        'Shampoo': 'fa-wind', 'Mask': 'fa-spray-can', 'Treatment': 'fa-flask', 'Serum': 'fa-oil-can', 'Styling': 'fa-fill-drip', 'Kit': 'fa-box'
      };
      const icon = iconMap[p.cat] || 'fa-product-hunt';
      const badges = {
        'sale': '<span class="badge badge-sale">Sale</span>',
        'new': '<span class="badge badge-new">New</span>',
        'best': '<span class="badge badge-best">Best Seller</span>'
      };
      const badgeHTML = p.badge && badges[p.badge] ? badges[p.badge] : '';
      const starsHTML = Array.from({ length: 5 }, (_, i) => i < p.rating ? '<i class="fas fa-star"></i>' : '<i class="fas fa-star empty"></i>').join('');
      const origHTML = p.origPrice ? `<span class="orig">${p.currency} ${p.origPrice.toFixed(2)}</span>` : '';
      const priceDisplay = p.currency + ' ' + p.price.toFixed(2);
      return `
    <div class="product-card fade-up ${delayClass}">
      <div class="product-card-img" data-product-id="${p.id}" style="cursor:pointer;">
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;z-index:1;">` : `<i class="fas ${icon}"></i>`}
        ${badgeHTML}
        <span class="brand-tag" style="z-index:2;">${p.brand}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-brand">${p.line || p.brand}</div>
        <div class="product-card-title" data-product-id="${p.id}" style="cursor:pointer;">${p.name}</div>
        <div class="stars">${starsHTML}</div>
        <div class="product-card-price">${priceDisplay} ${origHTML}</div>
        <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})"><i class="fas fa-shopping-bag"></i> Add to Cart</button>
      </div>
    </div>`;
    }

    function renderFeaturedProducts() {
      const brands = ['Maxylook', 'Genus', 'Versum', 'UNA'];
      const featured = brands.map(b => products.find(p => p.brand === b)).filter(Boolean);
      
      document.getElementById('featuredGrid').innerHTML = featured.map((p, i) => {
        const delayClass = 'fade-up-delay-' + ((i % 4) + 1);
        return `<div class="featured-horizontal-card fade-up ${delayClass}">
          <div class="fhc-img">
            <i class="fas fa-leaf fhc-bg-leaves"></i>
            <img src="${p.img}" alt="${p.name}">
          </div>
          <div class="fhc-details">
            <h3 class="fhc-title">${p.name}</h3>
            <div class="fhc-stars">
              ${'<i class="fas fa-star"></i>'.repeat(p.rating)}
              ${'<i class="far fa-star"></i>'.repeat(5-p.rating)}
              <span>(120)</span>
            </div>
            <div class="fhc-price">PKR ${p.price.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})} <small>PKR ${(p.price*1.3).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</small></div>
            <p class="fhc-desc">${p.desc}</p>
            <div class="fhc-actions">
              <button class="fhc-btn" onclick="addToCart(${p.id})">ADD TO CART</button>
              <button class="fhc-icon-btn" onclick="toggleWishlistItem(${p.id})"><i class="far fa-heart"></i></button>
              <button class="fhc-icon-btn" onclick="navigate('shop')"><i class="fas fa-info-circle"></i></button>
            </div>
          </div>
        </div>`;
      }).join('');
      observeDynamicContent();
    }

    function renderBrandCards() {
      const grid = document.getElementById('brandCardGrid');
      if (!grid) return;
      const brands = window.wpBrands || fallbackBrands;
      grid.innerHTML = brands.map((b, i) => {
        const delayClass = 'fade-up-delay-' + ((i % 4) + 1);
        return `
        <div class="brand-card fade-up ${delayClass}" onclick="navigate('shop');filterBrand('${b.name}')">
          <div class="brand-card-img ${b.id}" style="background:${b.gradient};color:${b.textColor}">
            ${b.img ? `<img src="${b.img}" alt="${b.name}" style="width:100%;height:100%;object-fit:contain;position:absolute;top:0;left:0;z-index:1;mix-blend-mode:multiply;opacity:0.5;padding:20px;">` : ''}
            <span style="position:relative;z-index:2;text-shadow:0 2px 8px rgba(0,0,0,0.2)">${b.name}</span>
          </div>
          <div class="brand-card-body">
            <h3>${b.name}</h3>
            <p>${b.desc}</p>
            <button class="brand-card-btn">Shop ${b.name}</button>
          </div>
        </div>
      `}).join('');
      observeDynamicContent();
    }

    function renderTestimonials() {
      const track = document.getElementById('testimonialTrack');
      if (!track) return;
      const testimonials = window.wpTestimonials || fallbackTestimonials;
      const cards = testimonials.map((t, i) => `
        <div class="testimonial-card">
          <div class="stars">${'<i class="fas fa-star"></i>'.repeat(t.rating)}</div>
          <p>"${t.text}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${t.avatar}</div>
            <div>
              <div class="testimonial-name">${t.name}</div>
              <div class="testimonial-role">${t.role}</div>
            </div>
          </div>
        </div>
      `).join('');
      // Duplicate for seamless loop
      track.innerHTML = cards + cards;
      observeDynamicContent();
    }

    function renderBlog() {
      const container = document.getElementById('blogPosts');
      if (!container) return;
      const posts = window.wpBlogPosts || fallbackBlogPosts;
      container.innerHTML = posts.map((p, i) => {
        const delayClass = 'fade-up-delay-' + ((i % 4) + 1);
        return `
        <article class="blog-card fade-up ${delayClass}">
          <div class="blog-card-img" style="background:${p.gradient}; cursor:pointer;" onclick="navigate('single-blog', ${p.id})">
            <i class="fas ${p.icon}"></i>
          </div>
          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span><i class="far fa-calendar"></i> ${p.date}</span>
              <span><i class="far fa-user"></i> ${p.author}</span>
            </div>
            <h3 style="cursor:pointer;" onclick="navigate('single-blog', ${p.id})">${p.title}</h3>
            <p>${p.excerpt}</p>
            <button class="btn btn-secondary btn-sm" onclick="navigate('single-blog', ${p.id})">Read More</button>
          </div>
        </article>
      `}).join('');
      observeDynamicContent();
    }

    function renderBestSellers() {
      const bestsellers = [];
      const seenBrands = new Set();
      
      // Sort all products by total_sales descending to find real bestsellers
      const sortedProducts = [...products].sort((a, b) => b.total_sales - a.total_sales);
      
      for (const p of sortedProducts) {
        if (!seenBrands.has(p.brand) && p.total_sales > 0) {
          bestsellers.push(p);
          seenBrands.add(p.brand);
        }
      }
      
      // If we don't have any products with sales, fallback to first product per brand
      if (bestsellers.length === 0) {
        for (const p of products) {
          if (!seenBrands.has(p.brand)) {
            bestsellers.push(p);
            seenBrands.add(p.brand);
          }
        }
      }
      
      document.getElementById('bestSellerGrid').innerHTML = bestsellers.slice(0, 8).map((p, i) => {
        p.badge = 'best'; // Add badge dynamically for UI
        return renderProductCard(p, i);
      }).join('');
      observeDynamicContent();
    }

    function renderShop() {
      const filtered = getFilteredProducts();
      const grid = document.getElementById('shopGrid');
      grid.innerHTML = filtered.map((p, i) => renderProductCard(p, i)).join('');
      document.getElementById('resultCount').textContent = filtered.length + ' products';
      observeDynamicContent();
    }

    function getFilteredProducts() {
      const brands = [...document.querySelectorAll('#shopSidebar input[type="checkbox"]:not([data-filter])')].filter(cb => cb.checked).map(cb => cb.value);
      let filtered = [...products];
      if (brands.length) filtered = filtered.filter(p => brands.includes(p.brand));

      const cats = [...document.querySelectorAll('#shopSidebar input[data-filter="category"]:checked')].map(cb => cb.value);
      if (cats.length) filtered = filtered.filter(p => cats.includes(p.cat));

      const priceRange = document.querySelector('input[name="price-range"]:checked');
      if (priceRange && priceRange.value) {
        const [min, max] = priceRange.value.split('-').map(Number);
        filtered = filtered.filter(p => {
          if (max) return p.price >= min && p.price <= max;
          return p.price >= min;
        });
      }

      const sort = document.getElementById('sortSelect').value;
      if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
      else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
      else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
      return filtered;
    }

    function applyFilters() { renderShop(); }

    function renderThankYou(orderId) {
      const container = document.getElementById('thankYouContent');
      if (container) {
        container.innerHTML = `
          <i class="fas fa-check-circle" style="font-size: 64px; color: var(--success); margin-bottom: 24px;"></i>
          <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 16px;">Order Confirmed!</h2>
          <p style="color: var(--muted); margin-bottom: 8px;">Your order <strong>#${orderId}</strong> has been successfully placed.</p>
          <p style="color: var(--muted); margin-bottom: 32px; font-size: 14px;">We'll process it right away and contact you with shipping details.</p>
          <button class="btn btn-primary" style="width: 100%" onclick="navigate('home')">Continue Shopping</button>
        `;
      }
    }

    function renderCheckoutSummary() {
      const container = document.getElementById('checkoutSummaryContainer');
      if (!container) return;
      const subtotal = getCartTotal();
      const shipping = subtotal >= 5000 ? 0 : 250;
      const total = subtotal + shipping;
      container.innerHTML = `
          <h3>Order Summary</h3>
          <div id="checkoutItems">${cart.map(item => `
            <div class="checkout-summary-item">
              <span class="cs-name">${item.name}</span>
              <span class="cs-qty">x${item.qty}</span>
              <span class="cs-price">PKR ${(item.price * item.qty).toFixed(0)}</span>
            </div>
          `).join('')}</div>
          <div class="checkout-total-row" style="margin-top:16px;">
            <span class="ctl-label">Subtotal</span>
            <span>PKR ${subtotal.toFixed(0)}</span>
          </div>
          <div class="checkout-total-row">
            <span class="ctl-label">Shipping (Pakistan)</span>
            <span>${shipping === 0 ? '<span style="color:var(--success)">Free</span>' : 'PKR ' + shipping}</span>
          </div>
          <div class="checkout-total-row" style="font-weight:700;font-size:18px;margin-top:12px;padding-top:12px;border-top:2px solid var(--hairline)">
            <span class="ctl-label">Total</span>
            <span>PKR ${total.toFixed(0)}</span>
          </div>
          <div class="checkout-msg" id="checkoutMsg"></div>
          <button type="button" class="place-order-btn" id="placeOrderBtn" onclick="submitOrder()">Place Order</button>
      `;
    }

    function renderCheckout() {
      const layout = document.getElementById('checkoutLayout');
      if (!cart.length) {
        layout.innerHTML = `<div class="checkout-empty"><i class="fas fa-shopping-bag"></i><h3>Your cart is empty</h3><p>Add some products before checking out.</p><button class="btn btn-primary" onclick="navigate('shop')">Shop Now</button></div>`;
        return;
      }
      
      let user = {};
      try { user = JSON.parse(localStorage.getItem('italia_user') || '{}'); } catch(e){}
      
      if (!document.getElementById('checkoutForm')) {
        layout.innerHTML = `
          <div class="checkout-form">
            <h3>Contact Information</h3>
            <form id="checkoutForm" onsubmit="submitOrder(event)">
              <input type="hidden" name="country" value="PK">
              <div class="form-row">
                <div class="form-group">
                  <label>First Name</label>
                  <input type="text" name="first_name" required>
                </div>
                <div class="form-group">
                  <label>Last Name</label>
                  <input type="text" name="last_name" required>
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" value="${user.email || ''}" required>
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" required>
              </div>
              <div class="form-group">
                <label>Address</label>
                <input type="text" name="address" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>City (Pakistan Only)</label>
                  <input type="text" name="city" required>
                </div>
                <div class="form-group">
                  <label>Postal Code</label>
                  <input type="text" name="postcode">
                </div>
              </div>
              <div class="form-group">
                <label>Order Notes (optional)</label>
                <textarea name="notes" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="checkout-summary" id="checkoutSummaryContainer"></div>
        `;
      }
      renderCheckoutSummary();
    }

    async function submitOrder(e) {
      if (e) e.preventDefault();
      const form = document.getElementById('checkoutForm');
      if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      const btn = document.getElementById('placeOrderBtn');
      const msg = document.getElementById('checkoutMsg');
      btn.disabled = true;
      btn.textContent = 'Placing Order...';
      msg.className = 'checkout-msg';

        let user = {};
        try { user = JSON.parse(localStorage.getItem('italia_user') || '{}'); } catch(e){}

        const subtotal = getCartTotal();
        const shipping = subtotal >= 5000 ? 0 : 250;

        const orderData = {
          payment_method: 'cod',
          payment_method_title: 'Cash on Delivery',
          set_paid: false,
          status: 'processing',
          customer_id: user.id || 0,
          billing: {
            first_name: data.first_name,
            last_name: data.last_name,
            address_1: data.address,
            city: data.city,
            postcode: data.postcode || '',
            country: data.country || 'PK',
            email: data.email,
            phone: data.phone
          },
          shipping: {
            first_name: data.first_name,
            last_name: data.last_name,
            address_1: data.address,
            city: data.city,
            postcode: data.postcode || '',
            country: data.country || 'PK'
          },
          line_items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            quantity: item.qty,
            price: String(item.price),
            subtotal: String(item.price * item.qty),
            total: String(item.price * item.qty),
            meta_data: [
              { key: 'Brand', value: item.brand }
            ]
          })),
          shipping_lines: [
            {
              method_id: shipping === 0 ? 'free_shipping' : 'flat_rate',
              method_title: shipping === 0 ? 'Free Shipping (Orders over 5000 PKR)' : 'Flat Rate Shipping (Pakistan)',
              total: String(shipping)
            }
          ],
          customer_note: data.notes || ''
        };

        try {
        const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
        const res = await fetch(WP.wc + '/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + auth
          },
          body: JSON.stringify(orderData)
        });
        const result = await res.json();
        if (res.ok && result.id) {
          msg.className = 'checkout-msg success';
          msg.textContent = 'Order placed successfully!';
          cart = [];
          saveCart();
          updateCartUI();
          btn.textContent = 'Order Placed';
          btn.disabled = true;
          renderThankYou(result.id);
          navigate('thankyou');
        } else {
          throw new Error(result.message || 'Order failed');
        }
      } catch(e) {
        msg.className = 'checkout-msg error';
        msg.textContent = 'Could not place order. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Place Order';
      }
    }

    function clearFilters() {
      document.querySelectorAll('#shopSidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
      const defaultRadio = document.querySelector('input[name="price-range"][value=""]');
      if (defaultRadio) defaultRadio.checked = true;
      renderShop();
    }

    // ==================== UTILITIES ====================
    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function toggleFaq(el) {
      const answer = el.nextElementSibling;
      const icon = el.querySelector('i');
      answer.classList.toggle('open');
      icon.style.transform = answer.classList.contains('open') ? 'rotate(180deg)' : '';
    }

    async function submitContact(e) {
      e.preventDefault();
      const form = e.target;
      const data = Object.fromEntries(new FormData(form));
      data._wpcf7_unit_tag = 'cf7-contact-' + Date.now();
      const btn = form.querySelector('button[type="submit"]');
      const msg = form.querySelector('.cf7-msg');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      const res = await wpPost('/wp-json/contact-form-7/v1/contact-forms/12/feedback', data, true);
      if (msg) {
        msg.textContent = res ? 'Thank you! We\'ll get back to you within 24 hours.' : 'Something went wrong. Please try again.';
        msg.style.display = 'block';
        msg.style.color = res ? 'var(--success)' : 'var(--pink-dark)';
      }
      btn.disabled = false;
      btn.textContent = 'Send Message';
      if (res) { form.reset(); setTimeout(() => { if (msg) msg.style.display = 'none'; }, 4000); }
    }

    async function submitNewsletter(e) {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const data = { 'your-email': input.value, _wpcf7_unit_tag: 'cf7-newsletter-' + Date.now() };
      const btn = e.target.querySelector('button');
      btn.disabled = true;
      btn.textContent = 'Subscribing...';
      const res = await wpPost('/wp-json/contact-form-7/v1/contact-forms/13/feedback', data, true);
      btn.disabled = false;
      btn.textContent = 'Subscribe';
      if (res) {
        showToast('Welcome! Check your inbox for 10% off.');
        input.value = '';
      } else {
        showToast('Subscription failed. Try again.');
      }
    }

    // ==================== TRACK ORDER ====================
    async function trackOrder() {
      let orderId = document.getElementById('trackOrderId')?.value.trim();
      const email = document.getElementById('trackEmail')?.value.trim();
      if (!orderId || !email) { showToast('Please enter order number and email.'); return; }
      
      // Strip out non-numeric characters (like "IC-") for the API
      orderId = orderId.replace(/\D/g, '');
      
      const btn = document.querySelector('#page-track-order .btn-primary');
      btn.disabled = true; btn.textContent = 'SEARCHING...';
      try {
        const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
        const res = await fetch(WP.wc + '/orders/' + orderId, {
          headers: { 'Authorization': 'Basic ' + auth }
        });
        if (!res.ok) throw new Error('Order not found');
        const order = await res.json();
        if (order.billing?.email?.toLowerCase() !== email.toLowerCase()) throw new Error('Email does not match');
        const statusMap = { 'pending': 'Pending', 'processing': 'Processing', 'completed': 'Completed', 'on-hold': 'On Hold', 'cancelled': 'Cancelled', 'refunded': 'Refunded', 'failed': 'Failed' };
        showToast('Order #' + order.id + ': ' + (statusMap[order.status] || order.status) + ' — Total: ' + order.currency + ' ' + parseFloat(order.total).toFixed(2));
      } catch(e) {
        showToast('Order not found or email does not match.');
      }
      btn.disabled = false; btn.textContent = 'TRACK ORDER';
    }

    // ==================== MY ACCOUNT ====================
    let isLoginMode = false;
    function toggleAuthMode() {
      isLoginMode = !isLoginMode;
      document.getElementById('authTitle').innerText = isLoginMode ? 'Sign In' : 'Create Account';
      document.getElementById('authBtn').innerText = isLoginMode ? 'SIGN IN' : 'CREATE ACCOUNT';
      document.getElementById('pageAuthSubtitle').innerText = isLoginMode
        ? 'Sign in to access your orders, track shipments, and more.'
        : 'Create an account to place orders, track shipments, and more.';
      document.getElementById('authToggleText').innerHTML = isLoginMode 
        ? 'Need an account? <a href="#" onclick="toggleAuthMode(); return false;" style="color:var(--purple);font-weight:600;">Sign Up</a>'
        : 'Already have an account? <a href="#" onclick="toggleAuthMode(); return false;" style="color:var(--purple);font-weight:600;">Sign In</a>';
    }

    async function handleAuth() {
      if (isLoginMode) {
        await loginCustomer();
      } else {
        await registerCustomer();
      }
    }

    async function loginCustomer() {
      const email = document.getElementById('authEmail').value.trim();
      const pass = document.getElementById('authPass').value.trim();
      if (!email || !pass) { showToast('Please enter email and password.'); return; }
      
      const btn = document.getElementById('authBtn');
      btn.disabled = true; btn.textContent = 'SIGNING IN...';
      
      try {
        const res = await fetch(WP.url + '/wp-json/italia/v1/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pass })
        });
        const result = await res.json();
        
        if (res.ok && result.token) {
          localStorage.setItem('italia_user', JSON.stringify(result));
          showToast('Welcome back, ' + (result.name || result.username) + '!');
          renderLoggedInState(result);
        } else {
          throw new Error(result.message || 'Login failed');
        }
      } catch (e) {
        showToast(e.message || 'Invalid credentials or server error.');
      }
      btn.disabled = false; btn.textContent = 'SIGN IN';
    }

    async function registerCustomer() {
      const email = document.getElementById('authEmail').value.trim();
      const pass = document.getElementById('authPass').value.trim();
      if (!email || !pass) { showToast('Please enter email and password.'); return; }
      const btn = document.getElementById('authBtn');
      btn.disabled = true; btn.textContent = 'CREATING ACCOUNT...';
      try {
        const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
        const res = await fetch(WP.wc + '/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth },
          body: JSON.stringify({ email: email, password: pass, username: email })
        });
        const result = await res.json();
        if (res.ok && result.id) {
          // Attempt to log them in automatically after registration
          try {
            const loginRes = await fetch(WP.url + '/wp-json/italia/v1/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email, password: pass })
            });
            const loginData = await loginRes.json();
            if (loginRes.ok && loginData.token) {
              localStorage.setItem('italia_user', JSON.stringify(loginData));
            }
          } catch(err) { /* silent fail on auto-login */ }
          
          showToast('Account created! Welcome to Italia Cosmetics.');
          renderLoggedInState({ name: email });
        } else {
          throw new Error(result.message || 'Registration failed');
        }
      } catch(e) {
        showToast(e.message || 'Could not create account.');
      }
      if(btn) { btn.disabled = false; btn.textContent = 'CREATE ACCOUNT'; }
    }

    function renderLoggedInState(user) {
      document.getElementById('authContainer').innerHTML = 
        '<div style="text-align:center;padding:var(--spacing-xl)">' +
          '<i class="fas fa-user-circle" style="font-size:48px;color:var(--purple);margin-bottom:var(--spacing-xs);display:block"></i>' +
          '<h3>Welcome, ' + (user.name || user.username) + '!</h3>' +
          '<p style="color:var(--muted)">You are successfully logged in.</p>' +
          '<button class="btn btn-outline" style="margin-top:var(--spacing-md);" onclick="logoutCustomer()">Logout</button>' +
        '</div>';
    }

    function logoutCustomer() {
      localStorage.removeItem('italia_user');
      showToast('You have been logged out.');
      // Reload page to reset state
      setTimeout(() => location.reload(), 1000);
    }

    function checkAuthStatus() {
      const userStr = localStorage.getItem('italia_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          renderLoggedInState(user);
        } catch(e) {}
      }
    }

    // ==================== SCROLL ANIMATIONS ====================
    function initScrollAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el));
    }

    function observeDynamicContent() {
      document.querySelectorAll('.fade-up:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('visible');
        } else if (window.IntersectionObserver) {
          new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
            });
          }, { threshold: 0.1 }).observe(el);
        }
      });
    }

    // ==================== INIT ====================
    document.addEventListener('DOMContentLoaded', () => {
      loadCart();
      loadWishlist();
      updateCartUI();
      updateWishlistUI();
      renderBrandCards();
      renderTestimonials();
      renderBlog();

      // ── Resolve starting page from URL ──
      const _init = getPageFromUrl();
      const _initPath = _init.page;
      const _initId = _init.id;
      const _initPageEl = document.getElementById('page-' + _initPath);

      if (_initPageEl && _initPath !== 'home') {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        _initPageEl.classList.add('active');
      }

      // Fetch products — detail rendering happens inside fetchProducts() after data is ready
      fetchProducts();
      fetchBrands();
      fetchTestimonials();
      fetchAbout();
      fetchBlogPosts();
      initScrollAnimations();

      // Trigger page-specific renderers that don't need products
      if (_initPath === 'single-blog' && _initId) {
        // Blog post details need posts loaded first; handled in fetchBlogPosts callback
        window._pendingSingleBlogId = _initId;
      }
      if (_initPath === 'shop') renderShop();
      if (_initPath === 'checkout') renderCheckout();
      if (_initPath === 'contact') { if (typeof renderFaqs === 'function') renderFaqs(); }
    });

    // ==================== DETAILS PAGES RENDERING ====================
    async function renderProductDetails(id) {
      const container = document.getElementById('productDetailsContainer');
      if (!container) return;

      try {
        // Show skeleton while loading
        container.innerHTML = `
          <div class="product-details-layout fade-up" style="animation:none;opacity:1;">
            <div class="product-details-img" style="background:var(--lavender);border-radius:var(--radius-lg);height:400px;display:flex;align-items:center;justify-content:center;">
              <i class="fas fa-spinner fa-spin" style="font-size:48px;color:var(--purple);"></i>
            </div>
            <div class="product-details-info">
              <div style="height:16px;background:#eee;border-radius:4px;width:100px;margin-bottom:12px;"></div>
              <div style="height:32px;background:#eee;border-radius:4px;width:80%;margin-bottom:16px;"></div>
              <div style="height:14px;background:#eee;border-radius:4px;width:120px;margin-bottom:20px;"></div>
              <div style="height:28px;background:#eee;border-radius:4px;width:140px;margin-bottom:16px;"></div>
              <div style="height:14px;background:#eee;border-radius:4px;width:100%;margin-bottom:8px;"></div>
              <div style="height:14px;background:#eee;border-radius:4px;width:90%;margin-bottom:8px;"></div>
            </div>
          </div>`;

        // Try local cache first, then fetch directly from WC API
        const idStr = String(id);
        let p = products.find(prod => String(prod.id) === idStr);

        if (!p) {
          try {
            const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
            const res = await fetch(WP.wc + '/products/' + id + '?_fields=id,name,description,price,attributes,images,categories,meta_data,total_sales', {
              headers: { 'Authorization': 'Basic ' + auth }
            });
            if (res.ok) {
              const wp = await res.json();
              const attrs = {};
              (wp.attributes || []).forEach(a => { attrs[a.name.toLowerCase()] = a.options?.[0] || ''; });
              const cat = wp.categories?.[0]?.name || 'Product';
              const catMap = { 'Shampoo': 'Shampoo', 'Mask': 'Mask', 'Treatment': 'Treatment', 'Serum': 'Serum', 'Styling': 'Styling', 'Kit': 'Kit' };
              p = {
                id: wp.id,
                brand: attrs.brand || 'Italia Cosmetics',
                name: wp.name || 'Product',
                line: attrs.line || attrs.product_line || '',
                desc: wp.description?.replace(/<[^>]*>/g, '') || '',
                price: parseFloat(wp.price) || 0,
                currency: (attrs.currency === '$' || attrs.currency === 'USD') ? 'PKR' : (attrs.currency || 'PKR'),
                cat: catMap[cat] || cat,
                badge: attrs.badge || '',
                rating: parseInt(attrs.rating) || 5,
                img: wp.images?.[0]?.src || (wp.meta_data?.find(m => m.key === 'product_image_url')?.value) || '',
                origPrice: attrs.orig_price ? parseFloat(attrs.orig_price) : null,
                total_sales: parseInt(wp.total_sales) || 0
              };
            }
          } catch (e) { console.warn('Direct product fetch failed:', e.message); }
        }

        if (!p) {
          // Last resort: search fallbackProducts
          p = fallbackProducts.find(prod => String(prod.id) === idStr);
        }

        if (!p) {
          container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
              <i class="fas fa-box-open" style="font-size:64px;color:#ccc;margin-bottom:20px;"></i>
              <h2 style="color:var(--charcoal);">Product Not Found</h2>
              <p style="color:var(--muted);margin-bottom:24px;">This product may no longer be available.</p>
              <button class="btn btn-primary" data-navigate="shop" style="cursor:pointer;">Browse All Products</button>
            </div>`;
          return;
        }

        const iconMap = { 'Shampoo': 'fa-wind', 'Mask': 'fa-spray-can', 'Treatment': 'fa-flask', 'Serum': 'fa-oil-can', 'Styling': 'fa-fill-drip', 'Kit': 'fa-box' };
        const icon = iconMap[p.cat] || 'fa-gift';
        const starsHTML = Array.from({ length: 5 }, (_, i) => i < p.rating
          ? '<i class="fas fa-star" style="color:var(--gold);"></i>'
          : '<i class="far fa-star" style="color:#ddd;"></i>').join('');
        const origHTML = p.origPrice
          ? `<span class="orig" style="text-decoration:line-through;color:#999;font-size:1rem;margin-left:10px;">${p.currency} ${p.origPrice.toFixed(2)}</span>`
          : '';
        const priceDisplay = p.currency + ' ' + p.price.toFixed(2);
        const badgeStyles = { 'best': 'background:var(--gold);color:var(--charcoal);', 'new': 'background:var(--purple);color:#fff;', 'sale': 'background:var(--pink);color:#fff;' };
        const badgeLabels = { 'best': 'Best Seller', 'new': 'New Arrival', 'sale': 'Sale' };
        const badgeHTML = p.badge ? `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:12px;${badgeStyles[p.badge] || 'background:var(--gold);color:var(--charcoal);'}">${badgeLabels[p.badge] || p.badge}</span>` : '';

        // Related products: same brand or same category, exclude current
        const related = products
          .filter(prod => String(prod.id) !== idStr && (prod.brand === p.brand || prod.cat === p.cat))
          .slice(0, 4);
        const relatedHTML = related.length
          ? `<div class="related-products"><h3>Related Products</h3><div class="related-grid">${related.map(rp => `
            <div class="related-card" data-product-id="${rp.id}" style="cursor:pointer;">
              <div class="related-card-img">${rp.img ? `<img src="${rp.img}" alt="${rp.name}">` : `<i class="fas ${iconMap[rp.cat] || 'fa-gift'}"></i>`}</div>
              <div class="related-card-info"><strong>${rp.name}</strong><span>${rp.currency} ${rp.price.toFixed(2)}</span></div>
            </div>`).join('')}</div></div>`
          : '';

        container.innerHTML = `
          <div class="product-details-layout fade-up">
            <div class="product-details-img">
              ${p.img
                ? `<img src="${p.img}" alt="${p.name}" style="max-width:100%;max-height:360px;object-fit:contain;">`
                : `<i class="fas ${icon}" style="font-size:100px;color:var(--purple);"></i>`
              }
            </div>
            <div class="product-details-info">
              ${badgeHTML}
              <div class="brand">${p.line || p.brand}</div>
              <h1>${p.name}</h1>
              <p class="product-subtitle">By <strong>${p.brand}</strong> &nbsp;|&nbsp; ${p.cat}</p>
              <div class="stars">${starsHTML}<span class="rating-num">(${p.rating}.0)</span></div>
              <div class="price">${priceDisplay}${origHTML}</div>
              ${p.desc ? `<p class="product-desc">${p.desc}</p>` : ''}
              <div class="product-actions">
                <button class="btn btn-primary" data-add-to-cart="${p.id}">
                  <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
                <button class="btn btn-wishlist" data-wishlist-toggle="${p.id}">
                  <i class="${isInWishlist(p.id) ? 'fas' : 'far'} fa-heart"></i>
                </button>
              </div>
              <div class="product-usp">
                <span><i class="fas fa-truck"></i>Free shipping over PKR 5,000</span>
                <span><i class="fas fa-shield-alt"></i>100% Authentic</span>
                <span><i class="fas fa-undo"></i>Easy returns</span>
              </div>
            </div>
          </div>
          ${relatedHTML}`;

        updateMeta(p.name, p.desc || 'Premium professional cosmetics by Italia Cosmetics.');
      } catch (e) {
        console.error('renderProductDetails error:', e);
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--pink-dark);"><p>Something went wrong loading this product.</p></div>`;
      }
    }

    function renderSingleBlog(id) {
      const posts = window.wpBlogPosts || fallbackBlogPosts;
      const p = posts.find(post => String(post.id) === String(id));
      if (!p) return;
      const container = document.getElementById('singleBlogContainer');
      
      container.innerHTML = `
        <div class="single-blog-layout fade-up">
          <div class="single-blog-header">
            <h1>${p.title}</h1>
            <div class="single-blog-meta">
              <span><i class="far fa-calendar"></i> ${p.date}</span>
              <span><i class="far fa-user"></i> ${p.author}</span>
            </div>
          </div>
          <div class="single-blog-img" style="background:${p.gradient}; display:flex; align-items:center; justify-content:center;">
            <i class="fas ${p.icon}" style="font-size:80px;color:rgba(255,255,255,0.8);"></i>
          </div>
          <div class="single-blog-content">
            ${p.content || p.excerpt || '<p>Full content is not available.</p>'}
          </div>
        </div>
      `;
      updateMeta(p.title, p.excerpt);
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }