import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { categoryService } from './category.service';

beforeEach(async () => {
  await db.open();
  await db.categories.clear();
});

afterEach(async () => {
  await db.categories.clear();
});

describe('categoryService.add', () => {
  it('returns the created category and no error', async () => {
    const { error, category } = await categoryService.add({ name: 'Food' });

    expect(error).toBeNull();
    expect(category).toBeDefined();
    expect(category?.name).toBe('Food');
    expect(category?.id).toMatch(/^ctg/);
  });

  it('persists the category to the database', async () => {
    await categoryService.add({ name: 'Transport' });
    const all = await db.categories.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Transport');
  });

  it('sets created_at on the new category', async () => {
    const before = new Date();
    await categoryService.add({ name: 'Health' });
    const [cat] = await db.categories.toArray();
    expect(cat.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('categoryService.list', () => {
  it('returns all categories ordered by name', async () => {
    await categoryService.add({ name: 'Zebra' });
    await categoryService.add({ name: 'Apple' });
    await categoryService.add({ name: 'Mango' });

    const list = await categoryService.list();
    expect(list.map((c) => c.name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('returns an empty array when no categories exist', async () => {
    const list = await categoryService.list();
    expect(list).toHaveLength(0);
  });
});

describe('categoryService.getById', () => {
  it('returns the category with the matching id', async () => {
    const { category } = await categoryService.add({ name: 'Bills' });
    const found = await categoryService.getById(category!.id!);
    expect(found?.name).toBe('Bills');
  });

  it('returns undefined for an unknown id', async () => {
    const found = await categoryService.getById('does-not-exist');
    expect(found).toBeUndefined();
  });
});

describe('categoryService.delete', () => {
  it('removes the category and returns null', async () => {
    const { category } = await categoryService.add({ name: 'Shopping' });
    const error = await categoryService.delete(category!.id!);

    expect(error).toBeNull();
    const all = await db.categories.toArray();
    expect(all).toHaveLength(0);
  });
});

describe('categoryService.seedDefaultCategories', () => {
  it('seeds 9 default categories when none exist', async () => {
    await categoryService.seedDefaultCategories();
    const all = await db.categories.toArray();
    expect(all).toHaveLength(9);
  });

  it('includes expected category names', async () => {
    await categoryService.seedDefaultCategories();
    const names = (await db.categories.toArray()).map((c) => c.name);
    expect(names).toContain('Food');
    expect(names).toContain('Bills');
    expect(names).toContain('Transportation');
  });

  it('does not seed again if categories already exist', async () => {
    await categoryService.add({ name: 'Existing' });
    await categoryService.seedDefaultCategories();
    const all = await db.categories.toArray();
    expect(all).toHaveLength(1); // only the manually added one
  });
});

describe('categoryService ids', () => {
  it('generates ids prefixed with "ctg" via add()', async () => {
    const { category } = await categoryService.add({ name: 'Test' });
    expect(category!.id).toMatch(/^ctg/);
  });

  it('generates unique ids for each category', async () => {
    const { category: c1 } = await categoryService.add({ name: 'A' });
    const { category: c2 } = await categoryService.add({ name: 'B' });
    expect(c1!.id).not.toBe(c2!.id);
  });
});
