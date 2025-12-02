import CardBudget from '@/components/organisms/card-budget';
import { useBudget } from '@/hooks/budget/use-budget';
import { FC, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FilterExpenses } from '../components/organisms/filter-expenses';
import { ListExpenses } from '../components/organisms/list-expenses';
import { useExpensesLive } from '../hooks/expenses/use-expenses-live';
import { Expense, ExpenseRecurrence } from '../repository/expense.db';
import { AppPageHeader } from '@/components/atoms';
import { expenseService } from '../services/expense-service/expense.service';

type ExpensesProps = object;

const Expenses: FC<ExpensesProps> = () => {
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());

  // Use live query hook - automatically updates when data changes
  const expenses = useExpensesLive({
    filterType: ExpenseRecurrence.Monthly,
    transactionDate,
  });

  const totalExpenses: number = useMemo(() => {
    if (!expenses) return 0;

    return expenses.reduce((acc, currentValue) => {
      return acc + currentValue.amount;
    }, 0);
  }, [expenses]);

  // start section budget ==========
  const { data: budget, isFetched: isUseBudgetFetched } =
    useBudget(transactionDate);
  const remainingBudget: number = (budget?.amount || 0) - totalExpenses;
  // end section budget ==========

  const handleDeleteExpense = async (id: Expense['id']) => {
    const result = await expenseService.delete(id);
    if (result) {
      toast.error('Error deleting expense');
      return;
    }
    // Success - useLiveQuery will automatically update the UI
    toast.success('Expense deleted successfully');
  };

  return (
    <div>
      <section id='home-header'>
        <AppPageHeader title={'My Day'} description={'Expenses'} />
      </section>

      <FilterExpenses
        onChangeTransactionDate={setTransactionDate}
        transactionDate={transactionDate}
      />

      {!!isUseBudgetFetched && (
        <CardBudget
          remainingBudget={remainingBudget}
          monthlyBudget={budget?.amount || null}
        />
      )}

      <ListExpenses
        onDeleteExpense={handleDeleteExpense}
        expenses={expenses}
      />
    </div>
  );
};

export default Expenses;
