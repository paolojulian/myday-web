import { FC } from "react";
import { Expense } from "../../../repository";
import { toCurrency } from "@/lib/currency.utils";

type Props = {
  onDeleteExpense: (id: number | undefined) => Promise<void>;
  expenses: Expense[] | undefined;
  isLoading: boolean;
  isFetched: boolean;
};

const ListExpenses: FC<Props> = ({
  onDeleteExpense,
  expenses,
  isLoading,
  isFetched,
}) => {
  const handleClickRemoveExpense = (id: number | undefined) => () => {
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
          className="block w-full"
        >
          <div className="flex flex-row justify-between items-center">
            <p>{expense.title}</p>
            <p>-{toCurrency(expense.amount)}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ListExpenses;
