import toast from 'react-hot-toast';
import { useDeleteExpense } from '../../../hooks/expenses/hooks/use-delete-expense';
import { useExpenses } from '../../../hooks/expenses/hooks/use-expenses';
import { Expense } from '../../../repository';

export default function ListExpenses() {
  const deleteExpense = useDeleteExpense();
  const { data: expenses, isLoading, isFetched } = useExpenses();

  const handleClickRemoveExpense = (id: Expense['id']) => async () => {
    const result = await deleteExpense.mutateAsync(id);
    if (result) {
      toast.error('Error deleting expense');
      return;
    }

    // TODO: Success
  };

  if (isLoading || !expenses) {
    return null;
  }

  if (isFetched && expenses.length === 0) {
    return <p>No expenses found</p>;
  }

  return (
    <div>
      {expenses.map((expense) => (
        <button
          key={expense.id}
          onClick={handleClickRemoveExpense(expense.id)}
          className='block'
        >
          <p>{expense.title}</p>
        </button>
      ))}
    </div>
  );
}
