import { useState } from 'react';
import {
  investmentService,
  UpdateInvestmentHoldingDetailsParams,
  UpdateInvestmentMarketPriceParams,
  UpdateInvestmentSimpleBalanceParams,
} from '@/services/investment-service/investment.service';

export const useUpdateInvestmentHolding = () => {
  const [isPending, setIsPending] = useState(false);

  const updateDetails = async (params: UpdateInvestmentHoldingDetailsParams) => {
    setIsPending(true);
    try {
      const result = await investmentService.updateHoldingDetails(params);
      if (result.error) throw result.error;
      return result.holding;
    } finally {
      setIsPending(false);
    }
  };

  const updateMarketPrice = async (params: UpdateInvestmentMarketPriceParams) => {
    setIsPending(true);
    try {
      const result = await investmentService.updateMarketPrice(params);
      if (result.error) throw result.error;
      return result.holding;
    } finally {
      setIsPending(false);
    }
  };

  const updateSimpleBalance = async (
    params: UpdateInvestmentSimpleBalanceParams
  ) => {
    setIsPending(true);
    try {
      const result = await investmentService.updateSimpleBalance(params);
      if (result.error) throw result.error;
      return result.holding;
    } finally {
      setIsPending(false);
    }
  };

  return { updateDetails, updateMarketPrice, updateSimpleBalance, isPending };
};
