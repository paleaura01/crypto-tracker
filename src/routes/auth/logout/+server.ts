// src/routes/auth/logout/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  const cookie = request.headers.get('cookie') ?? '';
  await fetch(`${env.SUPABASE_URL}/auth/v1/logout?scope=global`, {
    method: 'POST',
    headers: { 'Cookie': cookie }
  });

  const res = json({ success: true }, { status: 200 });
  res.headers.set(
    'Set-Cookie',
    `sb-session=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict`
  );
  return res;
};
