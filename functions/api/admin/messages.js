import { withAdmin, json } from '../../_lib/http.js';

export const onRequestGet = withAdmin(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM contact_messages ORDER BY id DESC'
  ).all();
  return json(results);
});
