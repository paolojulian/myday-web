
export enum ExpenseRecurrence {
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
}

export type Expense = {
  id: string;
  title: string;
  amount: number;
  transaction_date: Date;
  description?: string | null;
  category_id?: string | null; // Dynamic, users can create a category
  recurrence?: ExpenseRecurrence | null;
  recurrence_id?: string | null; // The parent recurrence of this expense, this is also an expense
  created_at: Date;
  updated_at: Date;
};
