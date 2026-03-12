import { useState } from 'react';
import { Expense } from '../../repository';
import { expenseService } from '../../services/expense-service/expense.service';

export const useDeleteExpense = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (id: Expense['id']) => {
    setIsPending(true);
    try {
      const error = await expenseService.delete(id);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
