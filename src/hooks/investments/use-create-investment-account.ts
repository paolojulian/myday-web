import { useState } from 'react';
import {
  CreateInvestmentAccountParams,
  investmentService,
} from '@/services/investment-service/investment.service';

export const useCreateInvestmentAccount = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: CreateInvestmentAccountParams) => {
    setIsPending(true);
    try {
      const result = await investmentService.createAccount(params);
      if (result.error) throw result.error;
      return result.account;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
