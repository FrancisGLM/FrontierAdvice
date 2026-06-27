import { NextResponse } from 'next/server';
import { STRAPI_URL } from '@/lib/config';

export async function GET() {
  try {
    const baseUrl = STRAPI_URL.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/paso-fronterizos?pagination[limit]=100`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Strapi error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy /api/proxy/pasos:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching pasos' },
      { status: 500 }
    );
  }
}
