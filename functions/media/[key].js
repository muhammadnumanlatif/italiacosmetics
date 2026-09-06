// GET /media/:key -- public endpoint serving images uploaded through the
// admin dashboard, stored as blobs in Workers KV (see functions/api/admin/upload.js).
export async function onRequestGet({ env, params }) {
  const { value, metadata } = await env.MEDIA.getWithMetadata(params.key, { type: 'arrayBuffer' });
  if (!value) return new Response('Not found', { status: 404 });

  return new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.contentType) || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
