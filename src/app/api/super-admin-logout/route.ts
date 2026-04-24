import { NextResponse } from 'next/server';

// Clears the httpOnly `sa-auth-token` super-admin cookie locally — mirrors
// /api/logout for the regular auth flow, so logout works even if the backend
// is down.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('sa-auth-token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
