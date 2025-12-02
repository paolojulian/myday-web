// Dexie Cloud configuration
// In production, these values come from environment variables set in Vercel

const dbUrl = import.meta.env.VITE_DBURL;

if (!dbUrl) {
  console.error('VITE_DBURL environment variable is not set!');
}

export const DEXIE_CLOUD_CONFIG = {
  databaseUrl: dbUrl!,
  requireAuth: false,
  tryUseServiceWorker: true,
};
