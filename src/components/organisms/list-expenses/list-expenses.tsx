import { FC } from 'react';
import { Expense } from '../../../repository';
import { toCurrency } from '@/lib/currency.utils';

type Props = {
  onDeleteExpense: (id: string | undefined) => Promise<void>;
  expenses: Expense[] | undefined;
};

const ListExpenses: FC<Props> = ({ onDeleteExpense, expenses }) => {
  const handleClickRemoveExpense = (id: string | undefined) => () => {
    onDeleteExpense(id);
  };

  // While loading (expenses is undefined)
  if (!expenses) {
    return <p>Loading...</p>;
  }

  // After loading completes with no results
  if (expenses.length === 0) {
    return <p>No expenses found</p>;
  }

  return (
    <div>
      {expenses.map((expense) => (
        <button
          key={expense.id}
          onClick={handleClickRemoveExpense(expense.id)}
          className='block w-full'
        >
          <div className='flex flex-row justify-between items-center'>
            <p>{expense.title}</p>
            <p>-{toCurrency(expense.amount)}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ListExpenses;
