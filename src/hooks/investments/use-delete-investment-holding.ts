import { useState } from 'react';
import { investmentService } from '@/services/investment-service/investment.service';

export const useDeleteInvestmentHolding = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (holdingId: string) => {
    setIsPending(true);
    try {
      const error = await investmentService.deleteHolding(holdingId);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
