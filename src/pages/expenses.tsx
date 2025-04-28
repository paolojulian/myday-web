import { FC, useState } from 'react';
import { ListExpenses } from '../components/organisms/list-expenses';
import { useDeleteExpense } from '../hooks/expenses/use-delete-expense';
import { useExpenses } from '../hooks/expenses/use-expenses';
import { Expense, ExpenseRecurrence } from '../repository/expense.db';
import toast from 'react-hot-toast';
import { FilterExpenses } from '../components/organisms/filter-expenses';

type ExpensesProps = object;

const Expenses: FC<ExpensesProps> = () => {
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const deleteExpense = useDeleteExpense();
  const {
    data: expenses,
    isLoading,
    isFetched,
  } = useExpenses({
    filterType: ExpenseRecurrence.Monthly,
    transactionDate,
  });

  const handleDeleteExpense = async (id: Expense['id']) => {
    const result = await deleteExpense.mutateAsync(id);
    if (result) {
      toast.error('Error deleting expense');
      return;
    }

    // TODO: Success
  };

  return (
    <div>
      <FilterExpenses
        onChangeTransactionDate={setTransactionDate}
        transactionDate={transactionDate}
      />
      <ListExpenses
        onDeleteExpense={handleDeleteExpense}
        expenses={expenses}
        isFetched={isFetched}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Expenses;
