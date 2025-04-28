import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../../services/budget-service/budget.service';
import { USE_BUDGET_KEYS } from './use-budget';

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetService.add,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USE_BUDGET_KEYS.all() });
    },
  });
};
