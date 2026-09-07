// ==================== CORE HELPERS ====================
async function api(path, options = {}) {
  const res = await fetch('/api/admin' + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error((data && data.error) || 'Request failed (' + res.status + ')');
  return data;
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? 'var(--danger)' : 'var(--charcoal)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtMoney(n) {
  return 'PKR ' + Math.round(Number(n) || 0).toLocaleString();
}

// ==================== MODAL ====================
function openModal(html) {
  document.getElementById('modalRoot').innerHTML =
    `<div class="modal-overlay" id="modalOverlay"><div class="modal">${html}</div></div>`;
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}
function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

// ==================== AUTH ====================
async function checkSession() {
  try {
    const me = await api('/me');
    showDashboard(me.email);
  } catch (e) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard(email) {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('sidebarEmail').textContent = email;
  switchView('orders');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    showDashboard(data.email);
  } catch (err) {
    errEl.textContent = err.message;
  }
  btn.disabled = false; btn.textContent = 'Sign In';
});

async function logout() {
  try { await fetch('/api/admin/logout', { method: 'POST' }); } catch (e) {}
  showLogin();
}

// ==================== VIEW ROUTER ====================
const VIEWS = {
  orders: { title: 'Orders', sub: 'All orders placed through the storefront.', render: renderOrders },
  products: { title: 'Products', sub: 'The full catalog shown in the shop.', render: renderProducts },
  blog: { title: 'Blog', sub: 'Articles shown on the storefront blog.', render: renderBlogList },
  brands: { title: 'Brands', sub: 'Brand cards shown on the Brands page.', render: renderBrands },
  testimonials: { title: 'Testimonials', sub: 'Customer quotes shown on the homepage.', render: renderTestimonials },
  messages: { title: 'Messages', sub: 'Contact form and newsletter submissions.', render: renderMessages }
};

function switchView(view) {
  document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const cfg = VIEWS[view];
  document.getElementById('mainContent').innerHTML = `
    <h1>${cfg.title}</h1>
    <p class="page-sub">${cfg.sub}</p>
    <div id="viewBody"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div></div>
  `;
  cfg.render();
}

document.querySelectorAll('.sidebar nav button').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ==================== ORDERS ====================
const ORDER_STATUSES = ['processing', 'completed', 'on-hold', 'cancelled', 'refunded'];

async function renderOrders() {
  const body = document.getElementById('viewBody');
  try {
    const orders = await api('/orders');
    if (!orders.length) {
      body.innerHTML = `<div class="empty-state"><i class="fas fa-receipt" style="font-size:32px;margin-bottom:10px;"></i><p>No orders yet.</p></div>`;
      return;
    }
    body.innerHTML = `
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th><th></th></tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${esc(o.billing_first_name)} ${esc(o.billing_last_name)}<br><span style="color:var(--muted);font-size:12px;">${esc(o.billing_email)}</span></td>
              <td>${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
              <td>${fmtMoney(o.total)}</td>
              <td><span class="status-pill status-${o.status}">${esc(o.status)}</span></td>
              <td>${esc((o.created_at || '').slice(0, 16))}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="openOrderDetail(${o.id})">View</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load orders: ${esc(e.message)}</div>`;
  }
}

async function openOrderDetail(id) {
  try {
    const o = await api('/orders/' + id);
    openModal(`
      <h2>Order #${o.id}</h2>
      <p style="color:var(--muted);font-size:13.5px;margin-top:-10px;">
        ${esc(o.billing_first_name)} ${esc(o.billing_last_name)} — ${esc(o.billing_email)} — ${esc(o.billing_phone)}<br>
        ${esc(o.billing_address_1)}, ${esc(o.billing_city)} ${esc(o.billing_postcode)}, ${esc(o.billing_country)}
      </p>
      <div class="order-detail-items"><table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${o.items.map(i => `<tr><td>${esc(i.name)}</td><td>${i.quantity}</td><td>${fmtMoney(i.price)}</td><td>${fmtMoney(i.total)}</td></tr>`).join('')}
        </tbody>
      </table></div>
      <div class="form-row">
        <label>Order Status</label>
        <select id="orderStatusSelect">
          ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn btn-primary" onclick="saveOrderStatus(${o.id})">Save Status</button>
      </div>
    `);
  } catch (e) {
    showToast(e.message, true);
  }
}

async function saveOrderStatus(id) {
  const status = document.getElementById('orderStatusSelect').value;
  try {
    await api('/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
    showToast('Order #' + id + ' updated to ' + status);
    closeModal();
    renderOrders();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ==================== GENERIC CRUD (Products / Brands / Testimonials) ====================
const PRODUCT_CATS = ['Shampoo', 'Mask', 'Treatment', 'Serum', 'Styling-finish', 'Leave-in', 'P-colori-diretti', 'Product'];

let currentProducts = [];

async function renderProducts() {
  const body = document.getElementById('viewBody');
  try {
    const products = await api('/products');
    currentProducts = products;
    body.innerHTML = `
      <div class="toolbar">
        <input type="search" id="productSearch" placeholder="Filter by name or brand..." style="min-width:260px;">
        <button class="btn btn-primary btn-sm" onclick="openProductForm()"><i class="fas fa-plus"></i> New Product</button>
      </div>
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th></th><th>Name</th><th>Brand / Line</th><th>Category</th><th>Price</th><th></th></tr></thead>
        <tbody id="productsTbody"></tbody>
      </table></div>
    `;
    const tbody = document.getElementById('productsTbody');
    function draw(list) {
      tbody.innerHTML = list.map(p => `
        <tr>
          <td>${p.img ? `<img class="thumb" src="${esc(p.img)}" alt="">` : ''}</td>
          <td class="wrap">${esc(p.name)}</td>
          <td>${esc(p.brand)}${p.line ? ' / ' + esc(p.line) : ''}</td>
          <td>${esc(p.cat)}</td>
          <td>${fmtMoney(p.price)}</td>
          <td class="row-actions">
            <button class="btn btn-secondary btn-sm" onclick="openProductForm(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" class="empty-state">No products match.</td></tr>`;
    }
    draw(products);
    document.getElementById('productSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      draw(products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)));
    });
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load products: ${esc(e.message)}</div>`;
  }
}

function openProductForm(id) {
  const p = id ? currentProducts.find(x => x.id === id) : {};
  const isEdit = !!(p && p.id);
  openModal(`
    <h2>${isEdit ? 'Edit Product #' + p.id : 'New Product'}</h2>
    <div class="form-row"><label>Name</label><input id="f_name" value="${esc(p.name)}" required></div>
    <div class="form-grid">
      <div class="form-row"><label>Brand</label><input id="f_brand" value="${esc(p.brand || 'Italia Cosmetics')}"></div>
      <div class="form-row"><label>Line</label><input id="f_line" value="${esc(p.line)}"></div>
      <div class="form-row"><label>Price (PKR)</label><input id="f_price" type="number" step="1" value="${p.price ?? ''}" required></div>
      <div class="form-row"><label>Original Price (optional)</label><input id="f_orig_price" type="number" step="1" value="${p.origPrice ?? ''}"></div>
      <div class="form-row"><label>Category</label>
        <select id="f_cat">${PRODUCT_CATS.map(c => `<option ${c === p.cat ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div>
      <div class="form-row"><label>Badge</label>
        <select id="f_badge"><option value="">None</option>${['best','sale','new'].map(b => `<option ${b === p.badge ? 'selected' : ''}>${b}</option>`).join('')}</select>
      </div>
      <div class="form-row"><label>Rating (1-5)</label><input id="f_rating" type="number" min="1" max="5" value="${p.rating || 5}"></div>
    </div>
    <div class="form-row"><label>Image URL</label><input id="f_img" value="${esc(p.img)}">
      <div class="field-hint">Paste a link, or use the uploader below.</div>
      <input type="file" id="f_imgFile" accept="image/*" style="margin-top:8px;">
    </div>
    <div class="form-row"><label>Description</label><textarea id="f_description" rows="3">${esc(p.desc)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProduct(${p.id || 'null'})">Save</button>
    </div>
  `);
  document.getElementById('f_imgFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      document.getElementById('f_img').value = url;
      showToast('Image uploaded');
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

async function saveProduct(id) {
  const payload = {
    name: document.getElementById('f_name').value.trim(),
    brand: document.getElementById('f_brand').value.trim(),
    line: document.getElementById('f_line').value.trim(),
    price: document.getElementById('f_price').value,
    orig_price: document.getElementById('f_orig_price').value || null,
    cat: document.getElementById('f_cat').value,
    badge: document.getElementById('f_badge').value,
    rating: document.getElementById('f_rating').value,
    img: document.getElementById('f_img').value.trim(),
    description: document.getElementById('f_description').value.trim()
  };
  if (!payload.name || !payload.price) { showToast('Name and price are required', true); return; }
  try {
    await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showToast('Product saved');
    closeModal();
    renderProducts();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await api('/products/' + id, { method: 'DELETE' });
    showToast('Product deleted');
    renderProducts();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function uploadImage(file) {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-Filename': file.name },
    body: file
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

// ==================== BLOG ====================
async function renderBlogList() {
  const body = document.getElementById('viewBody');
  try {
    const posts = await api('/blog');
    body.innerHTML = `
      <div class="toolbar" style="justify-content:flex-end;">
        <button class="btn btn-primary btn-sm" onclick="openBlogForm()"><i class="fas fa-plus"></i> New Post</button>
      </div>
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th></th><th>ID</th><th>Title</th><th>Category</th><th>Date</th><th></th></tr></thead>
        <tbody>
          ${posts.map(p => `
            <tr>
              <td>${p.img ? `<img class="thumb" src="${esc(p.img)}" alt="">` : ''}</td>
              <td>${p.id}</td>
              <td class="wrap">${esc(p.title)}</td>
              <td>${esc(p.cat)}</td>
              <td>${esc(p.date)}</td>
              <td class="row-actions">
                <button class="btn btn-secondary btn-sm" onclick="editBlogPost(${p.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBlogPost(${p.id})">Delete</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="6" class="empty-state">No posts yet.</td></tr>`}
        </tbody>
      </table></div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load posts: ${esc(e.message)}</div>`;
  }
}

async function editBlogPost(id) {
  try {
    const post = await api('/blog/' + id);
    openBlogForm(post);
  } catch (e) {
    showToast(e.message, true);
  }
}

function openBlogForm(p) {
  p = p || {};
  const isEdit = !!p.id;
  openModal(`
    <h2>${isEdit ? 'Edit Post #' + p.id : 'New Post'}</h2>
    <div class="form-grid">
      <div class="form-row"><label>ID ${isEdit ? '' : '(pick a unique number, e.g. 340)'}</label>
        <input id="f_id" type="number" value="${p.id || ''}" ${isEdit ? 'readonly' : ''}></div>
      <div class="form-row"><label>Category</label>
        <select id="f_cat"><option>Shampoo</option><option>Mask</option><option>Treatment</option></select>
      </div>
    </div>
    <div class="form-row"><label>Title</label><input id="f_title" value="${esc(p.title)}" required></div>
    <div class="form-grid">
      <div class="form-row"><label>Author</label><input id="f_author" value="${esc(p.author || 'Italia Editorial Board')}"></div>
      <div class="form-row"><label>Date</label><input id="f_date" placeholder="Sep 7, 2026" value="${esc(p.date)}"></div>
      <div class="form-row"><label>Gradient (CSS)</label><input id="f_gradient" value="${esc(p.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)')}"></div>
      <div class="form-row"><label>Icon (Font Awesome class)</label><input id="f_icon" value="${esc(p.icon || 'fa-star')}"></div>
    </div>
    <div class="form-row"><label>Image URL</label><input id="f_img" value="${esc(p.img)}">
      <div class="field-hint">Shown instead of the gradient/icon tile when set. Leave blank to fall back to the gradient.</div>
    </div>
    <div class="form-row"><label>Excerpt</label><textarea id="f_excerpt" rows="2">${esc(p.excerpt)}</textarea></div>
    <div class="form-row"><label>Content (HTML)</label><textarea id="f_content" rows="12">${esc(p.content)}</textarea>
      <div class="field-hint">Full HTML body, same format as the existing articles (h2/h3/p/blog-highlight-box/etc.).</div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBlogPost(${isEdit ? p.id : 'null'})">Save</button>
    </div>
  `);
  if (p.cat) document.getElementById('f_cat').value = p.cat;
}

async function saveBlogPost(id) {
  const payload = {
    id: id || Number(document.getElementById('f_id').value),
    title: document.getElementById('f_title').value.trim(),
    author: document.getElementById('f_author').value.trim(),
    date: document.getElementById('f_date').value.trim(),
    cat: document.getElementById('f_cat').value,
    gradient: document.getElementById('f_gradient').value.trim(),
    icon: document.getElementById('f_icon').value.trim(),
    img: document.getElementById('f_img').value.trim(),
    excerpt: document.getElementById('f_excerpt').value.trim(),
    content: document.getElementById('f_content').value
  };
  if (!payload.title || !payload.content || !payload.id) {
    showToast('ID, title, and content are required', true); return;
  }
  try {
    await api(id ? '/blog/' + id : '/blog', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showToast('Post saved');
    closeModal();
    renderBlogList();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteBlogPost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  try {
    await api('/blog/' + id, { method: 'DELETE' });
    showToast('Post deleted');
    renderBlogList();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ==================== BRANDS ====================
let currentBrands = [];

async function renderBrands() {
  const body = document.getElementById('viewBody');
  try {
    const brands = await api('/brands');
    currentBrands = brands;
    body.innerHTML = `
      <div class="toolbar" style="justify-content:flex-end;">
        <button class="btn btn-primary btn-sm" onclick="openBrandForm()"><i class="fas fa-plus"></i> New Brand</button>
      </div>
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th></th><th>Name</th><th>Description</th><th></th></tr></thead>
        <tbody>
          ${brands.map(b => `
            <tr>
              <td>${b.img ? `<img class="thumb" src="${esc(b.img)}" alt="">` : ''}</td>
              <td>${esc(b.name)}</td>
              <td class="wrap">${esc(b.description)}</td>
              <td class="row-actions">
                <button class="btn btn-secondary btn-sm" onclick="openBrandForm(${b.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBrand(${b.id})">Delete</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="4" class="empty-state">No brands yet.</td></tr>`}
        </tbody>
      </table></div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load brands: ${esc(e.message)}</div>`;
  }
}

function openBrandForm(id) {
  const b = id ? currentBrands.find(x => x.id === id) : {};
  openModal(`
    <h2>${b.id ? 'Edit Brand' : 'New Brand'}</h2>
    <div class="form-grid">
      <div class="form-row"><label>Name</label><input id="f_name" value="${esc(b.name)}" required></div>
      <div class="form-row"><label>CSS ID (short code, e.g. "mx")</label><input id="f_css_id" value="${esc(b.css_id)}"></div>
      <div class="form-row"><label>Gradient (CSS)</label><input id="f_gradient" value="${esc(b.gradient || 'linear-gradient(135deg,#8B5FBF,#A07DD6)')}"></div>
      <div class="form-row"><label>Text Color</label><input id="f_text_color" value="${esc(b.text_color || '#fff')}"></div>
    </div>
    <div class="form-row"><label>Image URL</label><input id="f_img" value="${esc(b.img)}"></div>
    <div class="form-row"><label>Description</label><textarea id="f_description" rows="3">${esc(b.description)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBrand(${b.id || 'null'})">Save</button>
    </div>
  `);
}

async function saveBrand(id) {
  const payload = {
    name: document.getElementById('f_name').value.trim(),
    css_id: document.getElementById('f_css_id').value.trim(),
    gradient: document.getElementById('f_gradient').value.trim(),
    text_color: document.getElementById('f_text_color').value.trim(),
    img: document.getElementById('f_img').value.trim(),
    description: document.getElementById('f_description').value.trim()
  };
  if (!payload.name) { showToast('Name is required', true); return; }
  try {
    await api(id ? '/brands/' + id : '/brands', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showToast('Brand saved');
    closeModal();
    renderBrands();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteBrand(id) {
  if (!confirm('Delete this brand?')) return;
  try {
    await api('/brands/' + id, { method: 'DELETE' });
    showToast('Brand deleted');
    renderBrands();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ==================== TESTIMONIALS ====================
let currentTestimonials = [];

async function renderTestimonials() {
  const body = document.getElementById('viewBody');
  try {
    const items = await api('/testimonials');
    currentTestimonials = items;
    body.innerHTML = `
      <div class="toolbar" style="justify-content:flex-end;">
        <button class="btn btn-primary btn-sm" onclick="openTestimonialForm()"><i class="fas fa-plus"></i> New Testimonial</button>
      </div>
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th>Name</th><th>Role</th><th>Text</th><th>Rating</th><th></th></tr></thead>
        <tbody>
          ${items.map(t => `
            <tr>
              <td>${esc(t.name)}</td>
              <td>${esc(t.role)}</td>
              <td class="wrap">${esc(t.text)}</td>
              <td>${'★'.repeat(t.rating)}</td>
              <td class="row-actions">
                <button class="btn btn-secondary btn-sm" onclick="openTestimonialForm(${t.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTestimonial(${t.id})">Delete</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="5" class="empty-state">No testimonials yet.</td></tr>`}
        </tbody>
      </table></div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load testimonials: ${esc(e.message)}</div>`;
  }
}

function openTestimonialForm(id) {
  const t = id ? currentTestimonials.find(x => x.id === id) : {};
  openModal(`
    <h2>${t.id ? 'Edit Testimonial' : 'New Testimonial'}</h2>
    <div class="form-grid">
      <div class="form-row"><label>Name</label><input id="f_name" value="${esc(t.name)}" required></div>
      <div class="form-row"><label>Role</label><input id="f_role" value="${esc(t.role)}" placeholder="e.g. Salon Owner"></div>
      <div class="form-row"><label>Rating (1-5)</label><input id="f_rating" type="number" min="1" max="5" value="${t.rating || 5}"></div>
      <div class="form-row"><label>Avatar Initials</label><input id="f_avatar" value="${esc(t.avatar)}" maxlength="3"></div>
    </div>
    <div class="form-row"><label>Quote</label><textarea id="f_text" rows="3">${esc(t.text)}</textarea></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTestimonial(${t.id || 'null'})">Save</button>
    </div>
  `);
}

async function saveTestimonial(id) {
  const payload = {
    name: document.getElementById('f_name').value.trim(),
    role: document.getElementById('f_role').value.trim(),
    text: document.getElementById('f_text').value.trim(),
    rating: document.getElementById('f_rating').value,
    avatar: document.getElementById('f_avatar').value.trim()
  };
  if (!payload.name || !payload.text) { showToast('Name and quote are required', true); return; }
  try {
    await api(id ? '/testimonials/' + id : '/testimonials', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showToast('Testimonial saved');
    closeModal();
    renderTestimonials();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await api('/testimonials/' + id, { method: 'DELETE' });
    showToast('Testimonial deleted');
    renderTestimonials();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ==================== MESSAGES ====================
async function renderMessages() {
  const body = document.getElementById('viewBody');
  try {
    const messages = await api('/messages');
    body.innerHTML = `
      <div class="data-table-wrap"><table class="data-table">
        <thead><tr><th></th><th>From</th><th>Subject</th><th>Message</th><th>Received</th><th></th></tr></thead>
        <tbody>
          ${messages.map(m => `
            <tr style="${m.is_read ? '' : 'font-weight:600;'}">
              <td>${m.is_read ? '' : '<i class="fas fa-circle" style="color:var(--purple);font-size:8px;"></i>'}</td>
              <td>${esc(m.name)}<br><span style="font-weight:400;color:var(--muted);font-size:12px;">${esc(m.email)}</span></td>
              <td>${esc(m.subject)}</td>
              <td class="wrap">${esc(m.message)}</td>
              <td>${esc((m.created_at || '').slice(0, 16))}</td>
              <td class="row-actions">
                ${m.is_read ? '' : `<button class="btn btn-secondary btn-sm" onclick="markMessageRead(${m.id})">Mark Read</button>`}
                <button class="btn btn-danger btn-sm" onclick="deleteMessage(${m.id})">Delete</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="6" class="empty-state">No messages yet.</td></tr>`}
        </tbody>
      </table></div>
    `;
  } catch (e) {
    body.innerHTML = `<div class="empty-state">Failed to load messages: ${esc(e.message)}</div>`;
  }
}

async function markMessageRead(id) {
  try {
    await api('/messages/' + id, { method: 'PATCH' });
    renderMessages();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await api('/messages/' + id, { method: 'DELETE' });
    showToast('Message deleted');
    renderMessages();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ==================== INIT ====================
checkSession();
