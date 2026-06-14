import { useState } from 'react';
import { recurringExpenseService } from '../../services/recurring-expense-service/recurring-expense.service';

export const useCancelRecurrence = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (templateId: string) => {
    setIsPending(true);
    try {
      const error = await recurringExpenseService.cancelRecurrence(templateId);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
