import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['frontieradvice.tech', 'strapi.frontieradvice.tech'],
  turbopack: {},
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/n8n/webhook/:path*',
        destination: `${process.env.N8N_SERVER_URL || 'https://n8n.frontieradvice.tech'}/webhook/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: wss:;"
          }
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
