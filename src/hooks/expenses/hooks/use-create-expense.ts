import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AddExpenseParams, expenseService } from "../../../services/expense-service/expense.service"
import { Expense } from "../../../repository";
import { USE_EXPENSES_KEYS } from "./use-expenses";

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.add,
    onMutate: async (expense: AddExpenseParams) => {
      await queryClient.cancelQueries({ queryKey: USE_EXPENSES_KEYS.list() });

      const previousExpenses =
        queryClient.getQueryData<Expense[]>(USE_EXPENSES_KEYS.list()) ?? [];

      queryClient.setQueryData<Expense[]>(USE_EXPENSES_KEYS.list(), (old) => {
        return [
          ...(old || []),
          {
            ...expense,
            id: 'temp-id',
            created_at: new Date(),
            updated_at: new Date(),
          }
        ]
      });

      return { previousExpenses };
    },
    onError: (_err, _newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(USE_EXPENSES_KEYS.list(), context.previousExpenses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USE_EXPENSES_KEYS.list() });
    },
  })
}