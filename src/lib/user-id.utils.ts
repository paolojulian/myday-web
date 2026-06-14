import { db } from '@/repository';

const DEVICE_ID_KEY = 'myday_device_id';

/**
 * Resolve a stable user identifier for server uploads.
 *
 * When cloud sync is enabled and the user is signed in, the Dexie Cloud
 * `userId` is the canonical identity. Otherwise (offline/local-only PWA) we
 * fall back to a persisted per-device UUID so the warranty endpoint — which
 * requires a non-empty `user_id` — still receives a stable namespace.
 */
export const getUserId = (): string => {
  const cloudUserId = db.cloud?.currentUser?.value?.userId;
  if (cloudUserId) return cloudUserId;

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};
