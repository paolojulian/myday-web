import { Try } from '@/index';
import { DBError } from '@/config/errors.constants';
import { handleError } from '@/lib/handle-error.utils';
import { db, Warranty, WarrantyUploadStatus } from '@/repository';

const generateWarrantyId = () => `wrt${crypto.randomUUID()}`;

// After this many failed upload attempts the sync service gives up retrying,
// so a permanently-rejected receipt isn't replayed on every launch/reconnect.
export const MAX_UPLOAD_ATTEMPTS = 5;

export type AddWarrantyParams = {
  title: string;
  expiration_date?: Date | null;
  imageFile: File | Blob;
  // Optional explicit metadata; falls back to File fields when omitted.
  filename?: string;
  contentType?: string;
};

export type UpdateWarrantyParams = {
  id: string;
  title?: string;
  expiration_date?: Date | null;
};

class WarrantyService {
  public async add(params: AddWarrantyParams): Promise<Try<Warranty>> {
    const dateNow = new Date();
    const id = generateWarrantyId();

    const isFile = params.imageFile instanceof File;
    const filename =
      params.filename ?? (isFile ? (params.imageFile as File).name : 'receipt');
    const contentType =
      params.contentType ||
      params.imageFile.type ||
      'application/octet-stream';

    const warranty: Warranty = {
      id,
      title: params.title.trim(),
      expiration_date: params.expiration_date ?? null,
      image_blob: params.imageFile,
      image_filename: filename,
      image_content_type: contentType,
      image_url: null,
      image_public_id: null,
      upload_status: WarrantyUploadStatus.Pending,
      upload_attempts: 0,
      created_at: dateNow,
      updated_at: dateNow,
    };

    try {
      await db.warranties.add(warranty);
      return [warranty, null];
    } catch (e) {
      return [null, handleError(e, new DBError('Unable to add warranty'))];
    }
  }

  public async update(params: UpdateWarrantyParams): Promise<Error | null> {
    try {
      await db.warranties.update(params.id, {
        ...(params.title !== undefined ? { title: params.title.trim() } : {}),
        ...(params.expiration_date !== undefined
          ? { expiration_date: params.expiration_date }
          : {}),
        updated_at: new Date(),
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to update warranty'));
    }
  }

  public async getById(id: string): Promise<Warranty | undefined> {
    return db.warranties.get(id);
  }

  /** All warranties sorted by soonest expiration first; undated ones last. */
  public async list(): Promise<Warranty[]> {
    const warranties = await db.warranties.toArray();
    return warranties.sort(compareByExpiration);
  }

  public async listPending(): Promise<Warranty[]> {
    return db.warranties
      .where('upload_status')
      .anyOf([WarrantyUploadStatus.Pending, WarrantyUploadStatus.Failed])
      .and((w) => (w.upload_attempts ?? 0) < MAX_UPLOAD_ATTEMPTS)
      .toArray();
  }

  /**
   * Revives receipts that were permanently parked after exhausting their upload
   * attempts (>= MAX_UPLOAD_ATTEMPTS). Intended to run after a successful upload:
   * a success proves the server is reachable/configured again, so failures that
   * were likely transient (e.g. a server-side 5xx) deserve a fresh pass instead
   * of staying stuck forever. Returns the revived warranties (with reset fields).
   */
  public async resetCappedFailures(): Promise<Warranty[]> {
    const capped = await db.warranties
      .where('upload_status')
      .equals(WarrantyUploadStatus.Failed)
      .and((w) => (w.upload_attempts ?? 0) >= MAX_UPLOAD_ATTEMPTS)
      .toArray();

    const updatedAt = new Date();
    for (const warranty of capped) {
      if (!warranty.id) continue;
      await db.warranties.update(warranty.id, {
        upload_status: WarrantyUploadStatus.Pending,
        upload_attempts: 0,
        updated_at: updatedAt,
      });
    }

    return capped.map((w) => ({
      ...w,
      upload_status: WarrantyUploadStatus.Pending,
      upload_attempts: 0,
      updated_at: updatedAt,
    }));
  }

  public async markSynced(
    id: string,
    result: { image_url: string; image_public_id: string }
  ): Promise<Error | null> {
    try {
      await db.warranties.update(id, {
        image_url: result.image_url,
        image_public_id: result.image_public_id,
        upload_status: WarrantyUploadStatus.Synced,
        updated_at: new Date(),
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to mark warranty synced'));
    }
  }

  public async markFailed(
    id: string,
    attempts?: number
  ): Promise<Error | null> {
    try {
      await db.warranties.update(id, {
        upload_status: WarrantyUploadStatus.Failed,
        ...(attempts !== undefined ? { upload_attempts: attempts } : {}),
        updated_at: new Date(),
      });
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to mark warranty failed'));
    }
  }

  public async delete(id: string): Promise<Error | null> {
    try {
      await db.warranties.delete(id);
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to delete warranty'));
    }
  }
}

/** Soonest expiration first; warranties without a date sort to the end. */
export const compareByExpiration = (a: Warranty, b: Warranty): number => {
  const aTime = a.expiration_date
    ? new Date(a.expiration_date).getTime()
    : Number.POSITIVE_INFINITY;
  const bTime = b.expiration_date
    ? new Date(b.expiration_date).getTime()
    : Number.POSITIVE_INFINITY;
  return aTime - bTime;
};

export const warrantyService = new WarrantyService();
