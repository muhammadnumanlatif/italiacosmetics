import { requireAdmin, unauthorized } from './auth.js';

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

// Wraps a Pages Function handler so it only runs for an authenticated admin
// session; otherwise short-circuits with 401. Keeps every admin/*.js file
// from repeating the same auth-check boilerplate.
export function withAdmin(handler) {
  return async (context) => {
    const admin = await requireAdmin(context);
    if (!admin) return unauthorized();
    context.admin = admin;
    return handler(context);
  };
}
