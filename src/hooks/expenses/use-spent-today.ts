import { USE_EXPENSES_KEYS } from "@/hooks/expenses/use-expenses"
import { expenseService } from "@/services/expense-service/expense.service"
import { useQuery } from "@tanstack/react-query"

export const useSpentToday = () => {
  return useQuery({
    queryKey: USE_EXPENSES_KEYS.spentToday(),
    queryFn: expenseService.spentToday,
  })
}