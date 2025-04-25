import { FC } from "react";
import { ListExpenses } from "../components/organisms/list-expenses";

type ExpensesProps = object;

const Expenses: FC<ExpensesProps> = () => {
  return (
    <div>
      <ListExpenses />
    </div>
  );
};

export default Expenses;
