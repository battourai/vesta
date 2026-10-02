import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ph&limit=5`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VestaPropertyPortal-Dev (rio@vesta.ph)',
        'Accept-Language': 'en',
      },
    });

    if (res.status === 429) {
      return NextResponse.json([]);
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim service busy' }, { status: res.status });
    }

    const textResponse = await res.text();
    
    if (textResponse.trim().startsWith('<')) {
      return NextResponse.json({ error: 'Blocked by remote service' }, { status: 502 });
    }

    const data = JSON.parse(textResponse);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Geocode API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
  }
}