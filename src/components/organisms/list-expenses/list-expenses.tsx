import { FC } from "react";
import { Expense } from "../../../repository";

type Props = {
  onDeleteExpense: (id: string)=> Promise<void>;
  expenses: Expense[] | undefined;
  isLoading: boolean;
  isFetched: boolean;
}

const ListExpenses: FC<Props> = ({
  onDeleteExpense,
  expenses,
  isLoading,
  isFetched
}) => {

  const handleClickRemoveExpense = (id: string) => () => {
    onDeleteExpense(id);
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

export default ListExpenses;