# Production Deployment Implementation Guide

This guide provides the step-by-step procedure to deploy your WordPress backend to your live domain (`https://italiacosmetics.com`) and connect your custom Headless SPA frontend to it.

## Architecture Strategy
Because your project is a Headless setup, the cleanest approach is to host the WordPress installation on a subdomain (like `api.italiacosmetics.com`) and host the HTML frontend on the main domain (`italiacosmetics.com`).

---

## Step 1: Set Up Hosting and Domains
1. **Purchase Hosting:** Get a standard web hosting plan that supports WordPress.
2. **Configure DNS:** In your domain registrar (GoDaddy, Namecheap, etc.), point your main domain (`italiacosmetics.com`) to your hosting provider.
3. **Create a Subdomain:** In your hosting control panel (cPanel/hPanel), create a subdomain called `api.italiacosmetics.com`. This is where WordPress will live invisibly.
4. **SSL Certificates:** Ensure you have a Let's Encrypt SSL certificate activated for **both** `italiacosmetics.com` and `api.italiacosmetics.com` so the site loads over HTTPS securely.

---

## Step 2: Install and Configure the WordPress Backend
1. **Install WordPress:** Use your hosting provider’s 1-click installer to install WordPress strictly on `api.italiacosmetics.com`.
2. **Install WooCommerce:** Log into your new WordPress dashboard, go to Plugins > Add New, and install/activate WooCommerce. Run through the basic setup wizard.
3. **Migrate Your Data:** 
   - **Step 3.1:** On your local WordPress site (`italiacosmeticscom.local`), go to Plugins > Add New, search for "All-in-One WP Migration", install, and activate it.
   - **Step 3.2:** In the left sidebar, go to All-in-One WP Migration > Export. Click "Export To" and select "File". Wait for the process to complete and download the `.wpress` file to your computer.
   - **Step 3.3:** On your live WordPress site (`api.italiacosmetics.com`), install and activate the same "All-in-One WP Migration" plugin.
   - **Step 3.4:** Go to All-in-One WP Migration > Import. Drag and drop the downloaded `.wpress` file to upload your data.
   - **Step 3.5:** Once the import finishes, click "Proceed" when prompted. You will now need to log back into the live site using your *local* WordPress credentials (since the database was overwritten).
   - **Step 3.6:** Finally, go to Settings > Permalinks and click "Save Changes" twice. This is a crucial step to ensure all internal links and API routes are reset properly for the live domain.
4. **Enable REST API & CORS:**
   - **Step 4.1:** Go to WooCommerce > Settings > Advanced > Legacy API and ensure the "Enable the legacy REST API" box is checked (if your setup relies on it).
   - **Step 4.2:** To prevent the browser from blocking requests between your frontend and backend, go to Plugins > Add New, search for **WP CORS**, and install/activate it.
   - **Step 4.3:** Go to Settings > CORS in your WordPress dashboard.
   - **Step 4.4:** Add your frontend domain `https://italiacosmetics.com` (and `http://localhost:3000` if testing locally) to the allowed origins. Set the allowed methods to `GET, POST, PUT, DELETE, OPTIONS`. Save changes.
5. **Generate Live API Keys (Application Passwords):**
   - Go to Users > Profile, scroll down to "Application Passwords".
   - Generate a new password (e.g., `Live Store Password`). Copy this password somewhere safe.

---

## Step 3: Update Your Frontend Code
Before uploading your HTML/JS files to the live server, you need to tell `app.js` to point to the new live backend instead of the local one.

1. **Update the WP Config Object:**
   Open `app.js` and find the `const WP = { ... }` block (around line 3420). Change the URLs to point to your new subdomain:
   ```javascript
   const WP = {
     url: 'https://api.italiacosmetics.com',
     rest: 'https://api.italiacosmetics.com/wp-json/wp/v2',
     wc: 'https://api.italiacosmetics.com/wp-json/wc/v3',
     acf: 'https://api.italiacosmetics.com/wp-json/acf/v3',
     graphql: 'https://api.italiacosmetics.com/graphql',
     cf7: 'https://api.italiacosmetics.com/wp-json/contact-form-7/v1/contact-forms'
   };
   ```
2. **Update the Auth Credentials:**
   In `app.js`, find where the `btoa(...)` authentication happens for API requests. Replace the placeholder credentials with your live WordPress username[admin] and the new Application Password[zDcn LLc9 ftiw o1Tf LiSb 71q5] you generated in Step 2:
   ```javascript
   const auth = btoa('admin:zDcn LLc9 ftiw o1Tf LiSb 71q5');
   ```
   *(Note: Since this is visible in JavaScript, make sure you configure your WooCommerce user permissions carefully so it only has access to read products and create orders, not delete things).*

---

## Step 4: Host the Frontend
1. **Upload the Files:** Using your hosting control panel's File Manager or FTP, upload all the frontend files in your `italiacosmetics.com` folder to the **root directory** of your main domain (`public_html` or similar). Essential files include:
   - `index.html`
   - `app.js`
   - `style.css`
   - `manifest.json`
   - `sw.js`
   - `robots.txt`
   - `sitemap.xml`
   - Any image assets

---

## Step 5: Test and Go Live
- Navigate to `https://italiacosmetics.com`. 
- Open the browser developer console (F12) to ensure there are no CORS (Cross-Origin Resource Sharing) or 404 errors.
- Test the cart and place a dummy order to ensure it successfully reaches your live WooCommerce dashboard.
