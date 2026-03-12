import { useState } from 'react';
import { budgetService } from '../../services/budget-service/budget.service';

export const useUpdateBudget = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (amount: number) => {
    setIsPending(true);
    try {
      return await budgetService.add(amount);
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
