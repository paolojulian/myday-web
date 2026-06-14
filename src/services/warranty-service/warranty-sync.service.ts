import dayjs from 'dayjs';
import { getUserId } from '@/lib/user-id.utils';
import { Warranty } from '@/repository';
import { warrantyApi } from './warranty.api';
import { warrantyService } from './warranty.service';

/**
 * Drains pending/failed warranty receipt uploads to the server.
 *
 * The image is always persisted locally first (offline-first); this service
 * replays the cloud upload when connectivity is available and writes back the
 * Cloudinary URL/public_id. Chosen over Workbox BackgroundSync because that
 * discards the upload response (so the returned image_url could never be saved)
 * and is unsupported on iOS Safari — the primary PWA target.
 */
class WarrantySyncService {
  private isDraining = false;

  public async drainQueue(): Promise<void> {
    // Background Sync API is absent on iOS, so we gate on the connectivity hint
    // we do have. A false negative just defers to the next trigger.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }
    if (this.isDraining) return;
    this.isDraining = true;

    try {
      const pending = await warrantyService.listPending();
      for (const warranty of pending) {
        await this.uploadOne(warranty);
      }
    } finally {
      this.isDraining = false;
    }
  }

  private async uploadOne(warranty: Warranty): Promise<void> {
    if (!warranty.id || !warranty.image_blob) return;

    const [result, error] = await warrantyApi.storeWarrantyReceipt({
      file: warranty.image_blob,
      filename: warranty.image_filename ?? 'receipt',
      contentType:
        warranty.image_content_type ??
        warranty.image_blob.type ??
        'application/octet-stream',
      user_id: getUserId(),
      title: warranty.title,
      expiration_date: warranty.expiration_date
        ? dayjs(warranty.expiration_date).format('YYYY-MM-DD')
        : undefined,
    });

    if (error || !result) {
      // Count the attempt so a permanently-failing upload eventually stops being
      // retried (listPending excludes warranties past MAX_UPLOAD_ATTEMPTS).
      await warrantyService.markFailed(warranty.id, (warranty.upload_attempts ?? 0) + 1);
      return;
    }

    await warrantyService.markSynced(warranty.id, result);
  }
}

export const warrantySyncService = new WarrantySyncService();
