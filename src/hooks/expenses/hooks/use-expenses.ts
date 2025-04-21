import { useQuery } from "@tanstack/react-query"
import { expenseService, ListFilter } from "../../../services/expense-service/expense.service"
import { Expense } from "../../../repository"

export const USE_EXPENSES_KEYS = {
  all: () => ["expenses"] as const,
  list: () => [...USE_EXPENSES_KEYS.all(), "list"] as const,
  detail: (id: Expense['id']) => [...USE_EXPENSES_KEYS.all(), 'detail', id],
}

export const useExpenses = (filter: ListFilter) => {
  return useQuery({
    queryKey: USE_EXPENSES_KEYS.list(),
    queryFn: () => expenseService.list(filter),
  })
}