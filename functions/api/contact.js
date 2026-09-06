import { json, readJson } from '../_lib/http.js';

// POST /api/contact -> replaces the Contact Form 7 feedback endpoint.
// Both the contact form and the newsletter form submit a field literally
// named "your-email" (matching the original CF7 field names in index.html),
// so newsletter vs. full-contact is distinguished by the presence of
// "your-message" (only the contact form has one), not by the email field.
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Missing body' }, 400);

  const isContactForm = 'your-message' in body;
  const name = isContactForm ? (body['your-name'] || '') : 'Newsletter signup';
  const email = body['your-email'] || '';
  const subject = isContactForm ? (body['your-subject'] || 'Contact form') : 'Newsletter Signup';
  const message = isContactForm ? (body['your-message'] || '') : '';

  if (!email) return json({ error: 'Missing email' }, 400);

  await env.DB.prepare(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
  ).bind(name, email, subject, message).run();

  return json({ ok: true });
}
