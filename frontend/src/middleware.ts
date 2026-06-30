import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting (MVP)
// Note: In a multi-instance production environment, use Redis (e.g., @upstash/ratelimit)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown-ip';
    const now = Date.now();

    const requestData = rateLimitMap.get(ip);

    if (requestData) {
      // If within the time window
      if (now - requestData.timestamp < RATE_LIMIT_WINDOW) {
        if (requestData.count >= MAX_REQUESTS_PER_WINDOW) {
          return new NextResponse('Too Many Requests', { status: 429 });
        }
        requestData.count += 1;
      } else {
        // Reset window
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      // First request from this IP
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }
  }

  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
