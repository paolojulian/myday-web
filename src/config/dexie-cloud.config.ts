// Dexie Cloud configuration
// In production, these values come from environment variables set in Vercel

export const DEXIE_CLOUD_CONFIG = {
  databaseUrl: import.meta.env.VITE_DBURL!,
  requireAuth: false,
  tryUseServiceWorker: true,
};
