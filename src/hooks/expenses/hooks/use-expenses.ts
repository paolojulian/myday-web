import { useQuery } from "@tanstack/react-query"
import { expenseService } from "../../../services/expense-service/expense.service"

export const USE_EXPENSES_KEYS = {
  all: () => ["expenses"] as const,
  list: () => [...USE_EXPENSES_KEYS.all(), "list"] as const,
}

export const useExpenses = () => {
  return useQuery({
    queryKey: USE_EXPENSES_KEYS.list(),
    queryFn: expenseService.list,
  })
}