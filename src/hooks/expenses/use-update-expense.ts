import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../../repository';
import {
  expenseService,
  UpdateExpenseParams,
} from '../../services/expense-service/expense.service';
import { USE_EXPENSES_KEYS } from './use-expenses';

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.update,
    onMutate: async (expense: UpdateExpenseParams) => {
      await queryClient.cancelQueries({ queryKey: USE_EXPENSES_KEYS.all() });

      const previousExpenses =
        queryClient.getQueryData<Expense[]>(USE_EXPENSES_KEYS.all()) ?? [];

      queryClient.setQueryData<Expense[]>(USE_EXPENSES_KEYS.all(), (old) => {
        return [
          ...(old || []),
          {
            ...expense,
            id: Date.now().toString(), // Use timestamp as temporary ID
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
      });

      return { previousExpenses };
    },
    onError: (_err, _newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(
          USE_EXPENSES_KEYS.all(),
          context.previousExpenses
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USE_EXPENSES_KEYS.all() });
    },
  });
};
