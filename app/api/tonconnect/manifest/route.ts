import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const origin = `${proto}://${host}`;
  
  const manifest = {
    url: origin,
    name: "TON Empires",
    iconUrl: "https://ton.org/static/ton_logo.svg",
    termsOfServiceUrl: `${origin}/terms`,
    privacyPolicyUrl: `${origin}/privacy`
  };

  // Ensure it's returned as JSON with the correct content type
  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
