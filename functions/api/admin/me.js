import { requireAdmin, unauthorized } from '../../_lib/auth.js';
import { json } from '../../_lib/http.js';

// GET /api/admin/me -> the dashboard calls this on load to check for a valid session
export async function onRequestGet(context) {
  const admin = await requireAdmin(context);
  if (!admin) return unauthorized();
  return json({ email: admin.email });
}
