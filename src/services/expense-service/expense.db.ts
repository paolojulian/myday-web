import Dexie, { Table } from "dexie";

export enum ExpenseRecurrence {
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
  None = "none",
}

export type Expense = {
  id: string;
  title: string;
  amount: number;
  transaction_date: Date;
  description?: string;
  category_id?: string; // Dynamic, users can create a category
  recurrence?: ExpenseRecurrence;
  recurrence_id?: string; // The parent recurrence of this expense, this is also an expense
  created_at: Date;
  updated_at: Date;
};

export class ExpenseDB extends Dexie {
  expenses!: Table<Expense, string>;

  static dbName: string = "expense_database";

  constructor() {
    super(ExpenseDB.dbName);
    this.version(1).stores({
      todos: "id, category_id, created_at", // primary key + indexes
    });
  }
}

export const expenseDB = new ExpenseDB();
