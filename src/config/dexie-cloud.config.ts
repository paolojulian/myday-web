// Dexie Cloud configuration
// In production, these values come from environment variables set in Vercel

export const DEXIE_CLOUD_CONFIG = {
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_DB_URL || 'https://z1uowu8yd.dexie.cloud',
  requireAuth: false,
};
