import { describe, expect, it } from 'vitest';
import {
  getSavedProjectionMonthlyAdd,
  saveProjectionMonthlyAdd,
} from './investment-settings.utils';

describe('investment settings utils', () => {
  it('returns the default monthly add when nothing is saved', () => {
    const storage = new MemoryStorage();

    expect(getSavedProjectionMonthlyAdd(storage)).toBe('25000');
  });

  it('saves and reads the projection monthly add', () => {
    const storage = new MemoryStorage();

    saveProjectionMonthlyAdd(storage, '35000');

    expect(getSavedProjectionMonthlyAdd(storage)).toBe('35000');
  });
});

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
