import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { db } from '@/repository';
import { WarrantyUploadStatus } from '@/repository/warranty.db';
import { MAX_UPLOAD_ATTEMPTS, warrantyService } from './warranty.service';
import { warrantyApi } from './warranty.api';
import { warrantySyncService } from './warranty-sync.service';

// The sync service is the orchestrator; the network call is mocked so we can
// drive success/failure deterministically while exercising the real Dexie-backed
// warrantyService + outbox logic.
vi.mock('./warranty.api', () => ({
  warrantyApi: { storeWarrantyReceipt: vi.fn() },
}));

const storeMock = warrantyApi.storeWarrantyReceipt as Mock;

const makeFile = (name = 'receipt.png') =>
  new File(['fake-bytes'], name, { type: 'image/png' });

// Resolve uploads by title: anything titled "fail" rejects, everything else
// succeeds. Lets a single drain mix successes and failures.
const resolveByTitle = () =>
  storeMock.mockImplementation(async ({ title }: { title: string }) =>
    title === 'fail'
      ? [null, new Error('boom')]
      : [{ image_url: 'u', image_public_id: 'p' }, null]
  );

const statusOf = async (title: string) => {
  const all = await db.warranties.toArray();
  return all.find((w) => w.title === title);
};

beforeEach(async () => {
  await db.open();
  await db.warranties.clear();
  storeMock.mockReset();
});

afterEach(async () => {
  await db.warranties.clear();
});

describe('warrantySyncService.drainQueue', () => {
  it('uploads pending receipts and marks them synced', async () => {
    resolveByTitle();
    await warrantyService.add({ title: 'ok', imageFile: makeFile() });

    await warrantySyncService.drainQueue();

    const synced = await statusOf('ok');
    expect(synced?.upload_status).toBe(WarrantyUploadStatus.Synced);
    expect(synced?.image_url).toBe('u');
  });

  it('revives capped failures and retries them after a successful upload', async () => {
    resolveByTitle();
    // A succeeds this drain; B is permanently parked at the attempt cap.
    await warrantyService.add({ title: 'ok', imageFile: makeFile() });
    const [parked] = await warrantyService.add({
      title: 'parked',
      imageFile: makeFile(),
    });
    await warrantyService.markFailed(parked!.id!, MAX_UPLOAD_ATTEMPTS);

    // Sanity: the parked one is excluded from the normal queue.
    expect((await warrantyService.listPending()).map((w) => w.title)).not.toContain(
      'parked'
    );

    await warrantySyncService.drainQueue();

    // The success revived the parked receipt and it uploaded in the same drain.
    expect((await statusOf('ok'))?.upload_status).toBe(WarrantyUploadStatus.Synced);
    expect((await statusOf('parked'))?.upload_status).toBe(
      WarrantyUploadStatus.Synced
    );
  });

  it('does NOT revive capped failures when nothing synced', async () => {
    resolveByTitle();
    // The only queued receipt fails, so there is no success signal.
    await warrantyService.add({ title: 'fail', imageFile: makeFile() });
    const [parked] = await warrantyService.add({
      title: 'parked',
      imageFile: makeFile(),
    });
    await warrantyService.markFailed(parked!.id!, MAX_UPLOAD_ATTEMPTS);

    await warrantySyncService.drainQueue();

    const stillParked = await statusOf('parked');
    expect(stillParked?.upload_status).toBe(WarrantyUploadStatus.Failed);
    expect(stillParked?.upload_attempts).toBe(MAX_UPLOAD_ATTEMPTS);
  });

  it('revived-but-still-broken receipts re-fail from a clean count, not re-capped', async () => {
    resolveByTitle();
    await warrantyService.add({ title: 'ok', imageFile: makeFile() });
    // Parked AND still broken: titled "fail" so the revived retry fails again.
    const [parked] = await warrantyService.add({
      title: 'fail',
      imageFile: makeFile(),
    });
    await warrantyService.markFailed(parked!.id!, MAX_UPLOAD_ATTEMPTS);

    await warrantySyncService.drainQueue();

    const reFailed = await statusOf('fail');
    expect(reFailed?.upload_status).toBe(WarrantyUploadStatus.Failed);
    // Reset to 0, then one failed retry → 1, not MAX. It will be retried again.
    expect(reFailed?.upload_attempts).toBe(1);
  });
});
