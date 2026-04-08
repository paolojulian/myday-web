import Dexie from 'dexie';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';
import { DATABASE_NAME } from '../config/database.constants';
import { DEXIE_CLOUD_CONFIG } from '../config/dexie-cloud.config';
import { Expense } from './expense.db';
import { Todo } from './todo.db';
import { Budget } from './budget.db';
import { Category } from './category.db';

class XpenseDB extends Dexie {
  // Private static instance to store the single instance of the class
  private static instance: XpenseDB;

  todos!: DexieCloudTable<Todo, 'id'>;
  expenses!: DexieCloudTable<Expense, 'id'>;
  budget!: DexieCloudTable<Budget, 'id'>;
  categories!: DexieCloudTable<Category, 'id'>;

  private constructor() {
    super(DATABASE_NAME, {
      addons: [dexieCloud],
      cache: 'immutable',
    });

    // Only configure Dexie Cloud if the user has enabled sync in settings
    const syncEnabled = localStorage.getItem('myday_sync_enabled') === 'true';
    if (syncEnabled && DEXIE_CLOUD_CONFIG.databaseUrl) {
      this.cloud.configure(DEXIE_CLOUD_CONFIG);
    }

    this.version(1).stores({
      todos: '@id, created_at',
      expenses: '@id, category_id, transaction_date, [transaction_date+created_at]',
      budget: '@id, created_at',
      categories: '@id, name, created_at',
    });

    // Add error handlers
    this.on('blocked', () => {
      console.warn(
        'Database upgrade blocked. Please close all other tabs with this site open.'
      );
    });

    this.on('versionchange', () => {
      console.log('Database version changed in another tab');
    });
  }

  public static getInstance(): XpenseDB {
    if (!XpenseDB.instance) {
      XpenseDB.instance = new XpenseDB();
    }
    return XpenseDB.instance;
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

export const db = XpenseDB.getInstance();

// Log database status on initialization (useful for debugging)
if (typeof window !== 'undefined') {
  db.open()
    .then(async () => {
      db.checkStatus();

      // Seed default categories on first run
      const { categoryService } = await import(
        '../services/category-service/category.service'
      );
      await categoryService.seedDefaultCategories();
    })
    .catch((error) => {
      console.error('Failed to open database:', error);
    });
}
