import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VestaPropertyPortal-Dev (rio@vesta.ph)',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim service busy' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Reverse Geocode API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch reverse geocode data' }, { status: 500 });
  }
}