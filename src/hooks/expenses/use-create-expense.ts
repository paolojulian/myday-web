import { useState } from 'react';
import {
  AddExpenseParams,
  expenseService,
} from '../../services/expense-service/expense.service';

export const useCreateExpense = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: AddExpenseParams) => {
    setIsPending(true);
    try {
      const error = await expenseService.add(params);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
