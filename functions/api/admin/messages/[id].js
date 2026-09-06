import { withAdmin, json } from '../../../_lib/http.js';

// PATCH /api/admin/messages/:id -> mark a contact message as read
export const onRequestPatch = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare(
    'UPDATE contact_messages SET is_read = 1 WHERE id = ?'
  ).bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Message not found' }, 404);
  return json({ ok: true });
});

export const onRequestDelete = withAdmin(async ({ env, params }) => {
  const result = await env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(params.id).run();
  if (!result.meta.changes) return json({ error: 'Message not found' }, 404);
  return json({ ok: true });
});
