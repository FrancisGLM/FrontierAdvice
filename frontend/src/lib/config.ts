// Centralized API configuration
// All API URLs are read from environment variables with sensible fallbacks.

export const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

export const ADMIN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_KEY || '';
