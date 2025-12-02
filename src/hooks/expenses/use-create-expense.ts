import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AddExpenseParams,
  expenseService,
} from '../../services/expense-service/expense.service';
import { USE_EXPENSES_KEYS } from './use-expenses';
import { Expense } from '../../repository';

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.add,
    onMutate: async (expense: AddExpenseParams) => {
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
