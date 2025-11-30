
export enum ExpenseRecurrence {
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
}

export type Expense = {
  id?: number;
  title: string;
  amount: number;
  transaction_date: Date;
  description?: string | null;
  category_id?: number | null; // Dynamic, users can create a category
  recurrence?: ExpenseRecurrence | null;
  recurrence_id?: number | null; // The parent recurrence of this expense, this is also an expense
  created_at: Date;
  updated_at: Date;
};
