import { describe, expect, it } from 'vitest';
import { ExpenseRecurrence } from '@/repository/expense.db';
import { WarrantyUploadStatus } from '@/repository/warranty.db';
import fixtureText from '../../ios/PokuExpensesTests/Fixtures/web-export-v1.json?raw';
import {
  EXPORT_FORMAT,
  EXPORT_VERSION,
  blobToBase64,
  buildExportFile,
  exportFileName,
  type ExportSource,
} from './export.utils';

const NOW = new Date('2026-11-10T01:00:00.000Z');
const d = (iso: string) => new Date(iso);

// 1×1 PNG. The iOS importer re-encodes it as JPEG.
const PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * The source behind the shared fixture. The iOS import tests read the same JSON
 * (ios/PokuExpensesTests/Fixtures/web-export-v1.json), so the two sides cannot drift.
 */
const fixtureSource = (): ExportSource => ({
  categories: [
    // "food" matches the iOS default "Food" by name: the importer maps it instead of adding it.
    { id: 'ctg-web-food', name: 'food', created_at: d('2025-01-02T03:04:05.000Z') },
    { id: 'ctg-web-pets', name: 'Pets', created_at: d('2025-01-02T03:04:06.000Z') },
    { name: 'No id, dropped', created_at: d('2025-01-02T03:04:07.000Z') },
  ],
  budget: [
    { id: 'bdg-web-1', amount: 25000, created_at: d('2025-01-01T00:00:00.000Z') },
    { id: 'bdg-web-2', amount: 30000, created_at: d('2026-10-01T00:00:00.000Z') },
  ],
  expenses: [
    {
      id: 'exp-web-lunch',
      title: 'Lunch',
      amount: 650,
      transaction_date: d('2026-11-03T04:05:06.789Z'),
      description: 'With the team',
      category_id: 'ctg-web-food',
      created_at: d('2026-11-03T04:05:06.789Z'),
      updated_at: d('2026-11-03T04:05:06.789Z'),
    },
    {
      id: 'exp-web-vet',
      title: 'Vet',
      amount: 1200.5,
      transaction_date: d('2026-11-04T10:00:00.000Z'),
      category_id: 'ctg-web-pets',
      created_at: d('2026-11-04T10:00:00.000Z'),
      updated_at: d('2026-11-04T10:00:00.000Z'),
    },
    {
      id: 'exp-web-rent',
      title: 'Rent',
      amount: 15000,
      transaction_date: d('2026-10-01T00:00:00.000Z'),
      description: null,
      category_id: null,
      recurrence: ExpenseRecurrence.Monthly,
      recurrence_id: null,
      created_at: d('2026-10-01T00:00:00.000Z'),
      updated_at: d('2026-10-01T00:00:00.000Z'),
    },
    {
      id: 'exp-web-refund',
      title: 'Shoe return',
      amount: -500,
      transaction_date: d('2026-11-05T08:00:00.000Z'),
      category_id: 'ctg-web-missing',
      warranty_id: 'wrt-web-fan',
      created_at: d('2026-11-05T08:00:00.000Z'),
      updated_at: d('2026-11-05T08:00:00.000Z'),
    },
    {
      title: 'No id, dropped',
      amount: 1,
      transaction_date: d('2026-11-05T08:00:00.000Z'),
      created_at: d('2026-11-05T08:00:00.000Z'),
      updated_at: d('2026-11-05T08:00:00.000Z'),
    },
  ],
  warranties: [
    {
      id: 'wrt-web-fan',
      title: 'Fan',
      expiration_date: d('2028-03-14T00:00:00.000Z'),
      image_base64: PIXEL_PNG,
      image_content_type: 'image/png',
      image_url: 'https://res.cloudinary.com/demo/fan.png',
      upload_status: WarrantyUploadStatus.Synced,
      created_at: d('2026-11-05T08:00:00.000Z'),
      updated_at: d('2026-11-05T08:00:00.000Z'),
    },
    {
      id: 'wrt-web-tv',
      title: 'TV',
      image_url: 'https://res.cloudinary.com/demo/tv.jpg',
      upload_status: WarrantyUploadStatus.Synced,
      created_at: d('2026-06-01T00:00:00.000Z'),
      updated_at: d('2026-06-01T00:00:00.000Z'),
    },
  ],
});

describe('buildExportFile', () => {
  it('matches the shared fixture the iOS importer is tested against', () => {
    expect(buildExportFile(fixtureSource(), NOW)).toEqual(JSON.parse(fixtureText));
  });

  it('writes the format, version and export time', () => {
    const file = buildExportFile({ categories: [], budget: [], expenses: [], warranties: [] }, NOW);
    expect(file).toEqual({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exported_at: '2026-11-10T01:00:00.000Z',
      categories: [],
      budget: [],
      expenses: [],
      warranties: [],
    });
    expect(EXPORT_FORMAT).toBe('poku-expenses-export');
    expect(EXPORT_VERSION).toBe(1);
  });

  it('drops records without an id', () => {
    const file = buildExportFile(fixtureSource(), NOW);
    expect(file.categories.map((c) => c.id)).toEqual(['ctg-web-food', 'ctg-web-pets']);
    expect(file.expenses.map((e) => e.id)).not.toContain(undefined);
    expect(file.expenses).toHaveLength(4);
  });

  it('writes dates as ISO strings', () => {
    const file = buildExportFile(fixtureSource(), NOW);
    expect(file.expenses[0].transaction_date).toBe('2026-11-03T04:05:06.789Z');
    expect(file.expenses[0].created_at).toBe('2026-11-03T04:05:06.789Z');
    expect(file.budget[1].created_at).toBe('2026-10-01T00:00:00.000Z');
    expect(file.warranties[0].expiration_date).toBe('2028-03-14T00:00:00.000Z');
  });

  it('normalises missing optional fields to null', () => {
    const file = buildExportFile(fixtureSource(), NOW);
    const vet = file.expenses.find((e) => e.id === 'exp-web-vet');
    expect(vet).toEqual({
      id: 'exp-web-vet',
      title: 'Vet',
      amount: 1200.5,
      transaction_date: '2026-11-04T10:00:00.000Z',
      description: null,
      category_id: 'ctg-web-pets',
      recurrence: null,
      recurrence_id: null,
      warranty_id: null,
      created_at: '2026-11-04T10:00:00.000Z',
      updated_at: '2026-11-04T10:00:00.000Z',
    });
    const tv = file.warranties.find((w) => w.id === 'wrt-web-tv');
    expect(tv).toMatchObject({ expiration_date: null, image_base64: null, image_content_type: null });
  });

  it('does not export local-only warranty fields', () => {
    const file = buildExportFile(fixtureSource(), NOW);
    expect(Object.keys(file.warranties[0]).sort()).toEqual([
      'created_at',
      'expiration_date',
      'id',
      'image_base64',
      'image_content_type',
      'image_url',
      'title',
      'updated_at',
    ]);
  });
});

describe('blobToBase64', () => {
  it('returns the bytes as base64 without a data: prefix', async () => {
    const blob = new Blob([new Uint8Array([0x68, 0x69])], { type: 'image/png' });
    expect(await blobToBase64(blob)).toBe('aGk=');
  });
});

describe('exportFileName', () => {
  it('names the file by the local date', () => {
    expect(exportFileName(new Date(2026, 10, 10, 9, 30))).toBe('poku-expenses-export-2026-11-10.json');
    expect(exportFileName(new Date(2027, 0, 5, 23, 59))).toBe('poku-expenses-export-2027-01-05.json');
  });
});
