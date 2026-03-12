import { useState } from 'react';
import {
  UpdateExpenseParams,
  expenseService,
} from '../../services/expense-service/expense.service';

export const useUpdateExpense = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: UpdateExpenseParams) => {
    setIsPending(true);
    try {
      const error = await expenseService.update(params);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
