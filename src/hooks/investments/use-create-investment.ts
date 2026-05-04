import { useState } from 'react';
import {
  AddInvestmentParams,
  investmentService,
} from '@/services/investment-service/investment.service';

export const useCreateInvestment = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: AddInvestmentParams) => {
    setIsPending(true);
    try {
      const result = await investmentService.add(params);
      if (result.error) throw result.error;
      return result.transaction;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
