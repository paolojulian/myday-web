import Dexie, { Table } from 'dexie';
import { DATABASE_NAME } from '../config/database.constants';
import { Expense } from './expense.db';
import { Todo } from './todo.db';

class MyDayDB extends Dexie {
  // Private static instance to store the single instance of the class
  private static instance: MyDayDB;

  todos!: Table<Todo, string>;
  expenses!: Table<Expense, string>;

  private constructor() {
    super(DATABASE_NAME);
    this.version(3).stores({
      todos: 'id, created_at', // primary key + indexes
      expenses: 'id, category_id, transaction_date, [transaction_date+created_at]', // primary key + indexes
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