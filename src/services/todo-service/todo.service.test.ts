import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/repository';
import { todoService } from './todo.service';

beforeEach(async () => {
  await db.open();
  await db.todos.clear();
});

afterEach(async () => {
  await db.todos.clear();
});

describe('todoService.add', () => {
  it('returns null on success and persists the todo', async () => {
    const error = await todoService.add({ title: 'Buy milk', description: '' });

    expect(error).toBeNull();
    const all = await db.todos.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Buy milk');
  });

  it('generates an id prefixed with "tds"', async () => {
    await todoService.add({ title: 'Test', description: '' });
    const [todo] = await db.todos.toArray();
    expect(todo.id).toMatch(/^tds/);
  });

  it('sets created_at on the new todo', async () => {
    const before = new Date();
    await todoService.add({ title: 'Task', description: '' });
    const [todo] = await db.todos.toArray();
    expect(todo.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('stores description when provided', async () => {
    await todoService.add({ title: 'Task', description: 'Some details' });
    const [todo] = await db.todos.toArray();
    expect(todo.description).toBe('Some details');
  });
});

describe('todoService.list', () => {
  it('returns all todos as [todos, null]', async () => {
    await todoService.add({ title: 'First', description: '' });
    await todoService.add({ title: 'Second', description: '' });

    const [todos, error] = await todoService.list();
    expect(error).toBeNull();
    expect(todos).toHaveLength(2);
  });

  it('returns an empty array when no todos exist', async () => {
    const [todos, error] = await todoService.list();
    expect(error).toBeNull();
    expect(todos).toHaveLength(0);
  });
});

describe('todoService.delete', () => {
  it('removes the todo and returns null', async () => {
    await todoService.add({ title: 'Delete me', description: '' });
    const [todos] = await todoService.list();
    const id = todos![0].id!;

    const error = await todoService.delete(id);
    expect(error).toBeNull();

    const all = await db.todos.toArray();
    expect(all).toHaveLength(0);
  });

  it('returns an error when id is undefined', async () => {
    const error = await todoService.delete(undefined as any);
    expect(error).toBeInstanceOf(Error);
  });

  it('does not affect other todos when deleting one', async () => {
    await todoService.add({ title: 'Keep', description: '' });
    await todoService.add({ title: 'Remove', description: '' });

    const [todos] = await todoService.list();
    const toRemove = todos!.find((t) => t.title === 'Remove')!;

    await todoService.delete(toRemove.id!);

    const [remaining] = await todoService.list();
    expect(remaining).toHaveLength(1);
    expect(remaining![0].title).toBe('Keep');
  });
});
