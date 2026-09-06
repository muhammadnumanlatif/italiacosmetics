import { withAdmin, json } from '../../_lib/http.js';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB -- generous for product/blog photos, keeps KV's 1 GB free tier from filling up fast
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// POST /api/admin/upload -- body is the raw file bytes, Content-Type is the
// image's real MIME type, X-Filename header carries the original filename.
// Stored as a blob in Workers KV (chosen over R2 since R2 requires a card on
// file even at $0 usage; KV's free tier needs none).
export const onRequestPost = withAdmin(async ({ request, env }) => {
  const contentType = request.headers.get('Content-Type') || '';
  if (!ALLOWED_TYPES.includes(contentType)) {
    return json({ error: 'Unsupported image type: ' + contentType }, 400);
  }

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength === 0) return json({ error: 'Empty file' }, 400);
  if (buffer.byteLength > MAX_BYTES) return json({ error: 'File too large (max 5 MB)' }, 413);

  const filename = request.headers.get('X-Filename') || 'upload';
  const key = crypto.randomUUID();

  await env.MEDIA.put(key, buffer, { metadata: { contentType, filename } });

  return json({ url: '/media/' + key }, 201);
});
