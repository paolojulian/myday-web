import { useLiveQuery } from 'dexie-react-hooks';
import { budgetService } from '../../services/budget-service/budget.service';

export const useBudget = (month: Date) => {
  const data = useLiveQuery(
    () => budgetService.getBudgetByMonth(month),
    [month.getFullYear(), month.getMonth()]
  );

  return {
    data,
    isLoading: data === undefined,
  };
};
