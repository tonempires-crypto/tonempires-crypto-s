import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  
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
