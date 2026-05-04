import { useState } from 'react';
import { investmentService } from '@/services/investment-service/investment.service';

export const useDeleteInvestmentAccount = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (accountId: string) => {
    setIsPending(true);
    try {
      const error = await investmentService.deleteAccount(accountId);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
