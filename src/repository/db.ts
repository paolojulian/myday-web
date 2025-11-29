import Dexie, { Table } from 'dexie';
import { DATABASE_NAME } from '../config/database.constants';
import { Expense } from './expense.db';
import { Todo } from './todo.db';
import { Budget } from './budget.db';

class MyDayDB extends Dexie {
  // Private static instance to store the single instance of the class
  private static instance: MyDayDB;

  todos!: Table<Todo, string>;
  expenses!: Table<Expense, string>;
  budget!: Table<Budget, string>;

  private constructor() {
    super(DATABASE_NAME);
    this.version(5).stores({
      todos: '++id, created_at', // primary key + indexes
      expenses: '++id, category_id, transaction_date, [transaction_date+created_at]', // primary key + indexes
      budget: '++id, created_at',
    });
    // Version 6: Fix ID fields to use string UUIDs instead of auto-increment
    this.version(6).stores({
      todos: 'id, created_at', // string UUID primary key + indexes
      expenses: 'id, category_id, transaction_date, [transaction_date+created_at]', // string UUID primary key + indexes
      budget: 'id, created_at', // string UUID primary key + indexes
    });

    // Add error handlers
    this.on('blocked', () => {
      console.warn('Database upgrade blocked. Please close all other tabs with this site open.');
    });

    this.on('versionchange', () => {
      console.log('Database version changed in another tab');
    });
  }

  public static getInstance(): MyDayDB {
    if (!MyDayDB.instance) {
      MyDayDB.instance = new MyDayDB();
    }
    return MyDayDB.instance;
  }

  public async checkStatus(): Promise<void> {
    try {
      const todoCount = await this.todos.count();
      const expenseCount = await this.expenses.count();
      const budgetCount = await this.budget.count();
      console.log('Database Status:', {
        name: this.name,
        version: this.verno,
        todos: todoCount,
        expenses: expenseCount,
        budgets: budgetCount,
      });
    } catch (error) {
      console.error('Error checking database status:', error);
    }
  }
}

export const db = MyDayDB.getInstance();

// Log database status on initialization (useful for debugging)
if (typeof window !== 'undefined') {
  db.open().then(() => {
    db.checkStatus();
  }).catch((error) => {
    console.error('Failed to open database:', error);
  });
}