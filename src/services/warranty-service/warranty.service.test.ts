import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { WarrantyUploadStatus } from '@/repository/warranty.db';
import {
  compareByExpiration,
  MAX_UPLOAD_ATTEMPTS,
  warrantyService,
} from './warranty.service';

const makeFile = (name = 'receipt.png', type = 'image/png') =>
  new File(['fake-bytes'], name, { type });

beforeEach(async () => {
  await db.open();
  await db.warranties.clear();
});

afterEach(async () => {
  await db.warranties.clear();
});

describe('warrantyService.add', () => {
  it('persists a warranty with the image blob and pending status', async () => {
    const [warranty, error] = await warrantyService.add({
      title: 'Macbook M5',
      expiration_date: new Date('2027-12-31'),
      imageFile: makeFile(),
    });

    expect(error).toBeNull();
    expect(warranty?.id?.startsWith('wrt')).toBe(true);

    const all = await db.warranties.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Macbook M5');
    expect(all[0].upload_status).toBe(WarrantyUploadStatus.Pending);
    expect(all[0].image_filename).toBe('receipt.png');
    expect(all[0].image_content_type).toBe('image/png');
    // Real IndexedDB stores the Blob natively; fake-indexeddb's structured-clone
    // polyfill does not preserve the Blob prototype, so we only assert it persists.
    expect(all[0].image_blob).toBeTruthy();
    expect(all[0].image_url).toBeNull();
  });

  it('allows a warranty without an expiration date', async () => {
    const [, error] = await warrantyService.add({
      title: 'No-date warranty',
      imageFile: makeFile(),
    });

    expect(error).toBeNull();
    const all = await db.warranties.toArray();
    expect(all[0].expiration_date).toBeNull();
  });
});

describe('warrantyService.markSynced / markFailed', () => {
  it('writes back the cloud url and flips status to synced', async () => {
    const [warranty] = await warrantyService.add({
      title: 'TV',
      imageFile: makeFile(),
    });

    await warrantyService.markSynced(warranty!.id!, {
      image_url: 'https://res.cloudinary.com/x/receipt.png',
      image_public_id: 'myday-web/u/receipt',
    });

    const all = await db.warranties.toArray();
    expect(all[0].upload_status).toBe(WarrantyUploadStatus.Synced);
    expect(all[0].image_url).toBe('https://res.cloudinary.com/x/receipt.png');
    expect(all[0].image_public_id).toBe('myday-web/u/receipt');
  });

  it('marks a warranty failed', async () => {
    const [warranty] = await warrantyService.add({
      title: 'Fridge',
      imageFile: makeFile(),
    });

    await warrantyService.markFailed(warranty!.id!);

    const all = await db.warranties.toArray();
    expect(all[0].upload_status).toBe(WarrantyUploadStatus.Failed);
  });
});

describe('warrantyService.listPending', () => {
  it('returns pending and failed but not synced warranties', async () => {
    const [pending] = await warrantyService.add({
      title: 'Pending',
      imageFile: makeFile(),
    });
    const [failed] = await warrantyService.add({
      title: 'Failed',
      imageFile: makeFile(),
    });
    const [synced] = await warrantyService.add({
      title: 'Synced',
      imageFile: makeFile(),
    });

    await warrantyService.markFailed(failed!.id!);
    await warrantyService.markSynced(synced!.id!, {
      image_url: 'u',
      image_public_id: 'p',
    });

    const result = await warrantyService.listPending();
    const titles = result.map((w) => w.title).sort();
    expect(titles).toEqual(['Failed', 'Pending']);
    expect(pending).toBeTruthy();
  });

  it('excludes warranties past the max upload attempts to stop retry storms', async () => {
    const [exhausted] = await warrantyService.add({
      title: 'Exhausted',
      imageFile: makeFile(),
    });

    await warrantyService.markFailed(exhausted!.id!, MAX_UPLOAD_ATTEMPTS);

    const result = await warrantyService.listPending();
    expect(result.map((w) => w.title)).not.toContain('Exhausted');
  });
});

describe('warrantyService.list', () => {
  it('sorts by soonest expiration, undated last', async () => {
    await warrantyService.add({
      title: 'Later',
      expiration_date: new Date('2030-01-01'),
      imageFile: makeFile(),
    });
    await warrantyService.add({
      title: 'Undated',
      imageFile: makeFile(),
    });
    await warrantyService.add({
      title: 'Soonest',
      expiration_date: new Date('2026-07-01'),
      imageFile: makeFile(),
    });

    const result = await warrantyService.list();
    expect(result.map((w) => w.title)).toEqual([
      'Soonest',
      'Later',
      'Undated',
    ]);
  });
});

describe('warrantyService.delete', () => {
  it('removes the warranty', async () => {
    const [warranty] = await warrantyService.add({
      title: 'Delete me',
      imageFile: makeFile(),
    });

    await warrantyService.delete(warranty!.id!);

    const all = await db.warranties.toArray();
    expect(all).toHaveLength(0);
  });
});

describe('compareByExpiration', () => {
  it('orders dated before undated', () => {
    const base = {
      title: '',
      upload_status: WarrantyUploadStatus.Pending,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const dated = { ...base, expiration_date: new Date('2026-01-01') };
    const undated = { ...base, expiration_date: null };
    expect(compareByExpiration(dated, undated)).toBeLessThan(0);
    expect(compareByExpiration(undated, dated)).toBeGreaterThan(0);
  });
});
