import { db } from '@/repository';
import type { Budget } from '@/repository/budget.db';
import type { Category } from '@/repository/category.db';
import type { Expense } from '@/repository/expense.db';
import type { Warranty } from '@/repository/warranty.db';

export const EXPORT_FORMAT = 'poku-expenses-export';
export const EXPORT_VERSION = 1;

export type ExportFile = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exported_at: string;
  categories: { id: string; name: string; created_at: string }[];
  budget: { id: string; amount: number; created_at: string }[];
  expenses: {
    id: string;
    title: string;
    amount: number;
    transaction_date: string;
    description: string | null;
    category_id: string | null;
    recurrence: 'monthly' | null;
    recurrence_id: string | null;
    warranty_id: string | null;
    created_at: string;
    updated_at: string;
  }[];
  warranties: {
    id: string;
    title: string;
    expiration_date: string | null;
    image_base64: string | null;
    image_content_type: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
  }[];
};

export type ExportSource = {
  categories: Category[];
  budget: Budget[];
  expenses: Expense[];
  warranties: (Warranty & { image_base64?: string | null })[];
};

const iso = (value: Date | string): string => new Date(value).toISOString();
const isoOrNull = (value: Date | string | null | undefined): string | null =>
  value == null ? null : iso(value);
const hasID = <T extends { id?: string }>(record: T): record is T & { id: string } => !!record.id;

/** Pure. Records without an id are dropped. */
export function buildExportFile(source: ExportSource, now: Date = new Date()): ExportFile {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exported_at: iso(now),
    categories: source.categories.filter(hasID).map((c) => ({
      id: c.id,
      name: c.name,
      created_at: iso(c.created_at),
    })),
    budget: source.budget.filter(hasID).map((b) => ({
      id: b.id,
      amount: b.amount,
      created_at: iso(b.created_at),
    })),
    expenses: source.expenses.filter(hasID).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      transaction_date: iso(e.transaction_date),
      description: e.description ?? null,
      category_id: e.category_id ?? null,
      recurrence: e.recurrence ?? null,
      recurrence_id: e.recurrence_id ?? null,
      warranty_id: e.warranty_id ?? null,
      created_at: iso(e.created_at),
      updated_at: iso(e.updated_at),
    })),
    warranties: source.warranties.filter(hasID).map((w) => ({
      id: w.id,
      title: w.title,
      expiration_date: isoOrNull(w.expiration_date),
      image_base64: w.image_base64 ?? null,
      image_content_type: w.image_content_type ?? null,
      image_url: w.image_url ?? null,
      created_at: iso(w.created_at),
      updated_at: iso(w.updated_at),
    })),
  };
}

/** The blob's bytes as base64, without a `data:` prefix. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the receipt image'));
    reader.readAsDataURL(blob);
  });
}

/** poku-expenses-export-YYYY-MM-DD.json, by the local date. */
export function exportFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `poku-expenses-export-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Reads the four Dexie tables, converts image blobs, returns the file. */
export async function exportAllData(): Promise<ExportFile> {
  const [categories, budget, expenses, warranties] = await Promise.all([
    db.categories.toArray(),
    db.budget.toArray(),
    db.expenses.toArray(),
    db.warranties.toArray(),
  ]);
  const withImages = await Promise.all(
    warranties.map(async (w) => ({
      ...w,
      image_base64: w.image_blob ? await blobToBase64(w.image_blob) : null,
      image_content_type: w.image_content_type ?? w.image_blob?.type ?? null,
    })),
  );
  return buildExportFile({ categories, budget, expenses, warranties: withImages });
}

/** navigator.share({ files }) when navigator.canShare allows it, otherwise an <a download> click. */
export async function saveExportFile(file: ExportFile): Promise<void> {
  const name = exportFileName();
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
  const shareable = new File([blob], name, { type: 'application/json' });

  if (navigator.canShare?.({ files: [shareable] })) {
    try {
      await navigator.share({ files: [shareable], title: name });
      return;
    } catch (error) {
      // Closing the share sheet is not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoking straight after click() can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
