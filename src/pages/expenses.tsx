import CardBudget from "@/components/organisms/card-budget";
import { useBudget } from "@/hooks/budget/use-budget";
import { FC, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FilterExpenses } from "../components/organisms/filter-expenses";
import { ListExpenses } from "../components/organisms/list-expenses";
import { useDeleteExpense } from "../hooks/expenses/use-delete-expense";
import { useExpenses } from "../hooks/expenses/use-expenses";
import { Expense, ExpenseRecurrence } from "../repository/expense.db";
import { AppPageHeader } from "@/components/atoms";

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

  const handleDeleteExpense = async (id: Expense["id"]) => {
    const result = await deleteExpense.mutateAsync(id);
    if (result) {
      toast.error("Error deleting expense");
      return;
    }

    // TODO: Success
  };

  return (
    <div>
      <section id="home-header">
        <AppPageHeader title={"My Day"} description={"Expenses"} />
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
        isFetched={isFetched}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Expenses;
