import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Redirect back to the frontend homepage with google_auth=success flag
  const targetUrl = new URL('/?google_auth=success', request.url);
  if (code) {
    targetUrl.searchParams.set('code', code);
  }
  if (state) {
    targetUrl.searchParams.set('state', state);
  }
  return NextResponse.redirect(targetUrl);
}
