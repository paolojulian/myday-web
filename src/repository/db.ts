import Dexie, { Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import { DATABASE_NAME } from '../config/database.constants';
import { DEXIE_CLOUD_CONFIG } from '../config/dexie-cloud.config';
import { Expense } from './expense.db';
import { Todo } from './todo.db';
import { Budget } from './budget.db';
import { Category } from './category.db';

class MyDayDB extends Dexie {
  // Private static instance to store the single instance of the class
  private static instance: MyDayDB;

  todos!: Table<Todo, number>;
  expenses!: Table<Expense, number>;
  budget!: Table<Budget, number>;
  categories!: Table<Category, number>;

  private constructor() {
    super(DATABASE_NAME, { addons: [dexieCloud] });

    // Version 1: Use @ prefix for Dexie Cloud global IDs
    this.version(1).stores({
      todos: '@id, created_at',
      expenses: '@id, category_id, transaction_date, [transaction_date+created_at]',
      budget: '@id, created_at',
      categories: '@id, name, created_at',
    });

    // Add error handlers
    this.on('blocked', () => {
      console.warn('Database upgrade blocked. Please close all other tabs with this site open.');
    });

    this.on('versionchange', () => {
      console.log('Database version changed in another tab');
    });

    // Configure Dexie Cloud
    this.cloud.configure(DEXIE_CLOUD_CONFIG);
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
      const categoryCount = await this.categories.count();
      console.log('Database Status:', {
        name: this.name,
        version: this.verno,
        todos: todoCount,
        expenses: expenseCount,
        budgets: budgetCount,
        categories: categoryCount,
      });
    } catch (error) {
      console.error('Error checking database status:', error);
    }
  }
}

export const db = MyDayDB.getInstance();

// Log database status on initialization (useful for debugging)
if (typeof window !== 'undefined') {
  db.open().then(async () => {
    db.checkStatus();

    // Seed default categories on first run
    const { categoryService } = await import('../services/category-service/category.service');
    await categoryService.seedDefaultCategories();
  }).catch((error) => {
    console.error('Failed to open database:', error);
  });
}