import { useQuery } from "@tanstack/react-query";
import { USE_EXPENSES_KEYS } from "./use-expenses";
import { expenseService } from "../../services/expense-service/expense.service";

const useRecentTransactions = () => {
  const recentTransactionsQuery = useQuery({
    queryKey: USE_EXPENSES_KEYS.recentTransactions(),
    queryFn: expenseService.recentTransactions,
  })

  return recentTransactionsQuery;
}

export default useRecentTransactions;