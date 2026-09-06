// Admin authentication: PBKDF2 password hashing + D1-backed session tokens.
// No third-party auth service and no bcrypt dependency (not available in the
// Workers runtime) -- PBKDF2 via Web Crypto's SubtleCrypto is the standard,
// audited primitive for this environment.

const PBKDF2_ITERATIONS = 210000; // OWASP 2023 minimum recommendation for PBKDF2-SHA256
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function toBase64(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hash = toBase64(new Uint8Array(derivedBits));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${hash}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = fromBase64(parts[2]);
  const expectedHash = fromBase64(parts[3]);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const actualHash = new Uint8Array(derivedBits);
  if (actualHash.length !== expectedHash.length) return false;
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(actualHash, expectedHash)
    : timingSafeEqualFallback(actualHash, expectedHash);
}

// Workers runtime has crypto.subtle.timingSafeEqual as of recent compat dates;
// fall back to a manual constant-time comparison if unavailable.
function timingSafeEqualFallback(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function generatePassword() {
  // 16 random bytes -> 22-char base64url string. Cryptographically random,
  // never crypto.Math.random(), per Workers security best practices.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(bytes).replace(/\+/g, 'A').replace(/\//g, 'B').replace(/=/g, '');
}

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function createSession(env, adminUserId) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await env.DB.prepare(
    'INSERT INTO admin_sessions (token, admin_user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, adminUserId, expiresAt).run();
  return { token, expiresAt };
}

// `Secure` is conditional on the actual request scheme: real browsers silently
// drop a `Secure` cookie set over plain http:// (e.g. `wrangler pages dev`
// without --local-protocol https), which would otherwise make local admin
// login look broken even though it works fine in production behind Cloudflare's
// always-HTTPS edge.
export function sessionCookie(token, expiresAt, request) {
  const expires = new Date(expiresAt).toUTCString();
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : '';
  return `admin_session=${token}; Path=/; HttpOnly;${secure} SameSite=Strict; Expires=${expires}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : '';
  return `admin_session=; Path=/; HttpOnly;${secure} SameSite=Strict; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

// Returns the authenticated admin_users row, or null. Also lazily deletes
// the session if it has expired (D1 has no native TTL, unlike KV).
export async function requireAdmin(context) {
  const { request, env } = context;
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['admin_session'];
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT admin_sessions.admin_user_id, admin_sessions.expires_at, admin_users.email ' +
    'FROM admin_sessions JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id ' +
    'WHERE admin_sessions.token = ?'
  ).bind(token).first();

  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    context.waitUntil(env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run());
    return null;
  }
  return { id: session.admin_user_id, email: session.email };
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
