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
  }

  public static getInstance(): MyDayDB {
    if (!MyDayDB.instance) {
      MyDayDB.instance = new MyDayDB();
    }
    return MyDayDB.instance;
  }
}

export const db = MyDayDB.getInstance();