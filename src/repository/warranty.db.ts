export enum WarrantyUploadStatus {
  // Image saved locally; cloud upload not yet attempted or pending retry.
  Pending = "pending",
  // Image uploaded; image_url / image_public_id populated.
  Synced = "synced",
  // Upload attempted and failed; will be retried by the sync service.
  Failed = "failed",
}

export type Warranty = {
  id?: string;
  title: string;
  expiration_date?: Date | null;
  // Local copy of the receipt — kept so the image renders offline and survives
  // before/independently of the Cloudinary upload.
  image_blob?: Blob | null;
  image_filename?: string | null;
  image_content_type?: string | null;
  // Populated from the server (Cloudinary) once the upload succeeds.
  image_url?: string | null;
  image_public_id?: string | null;
  upload_status: WarrantyUploadStatus;
  // Number of failed upload attempts; the sync service stops retrying past a cap
  // so a permanently-rejected upload (e.g. a 400) isn't replayed every launch.
  upload_attempts?: number;
  created_at: Date;
  updated_at: Date;
};
