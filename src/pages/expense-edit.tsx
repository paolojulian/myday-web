import ExpenseEditForm from '@/components/organisms/expense-form/expense-edit-form';
import { useExpense } from '@/hooks/expenses/use-expense';
import { FC } from 'react';
import { useParams } from 'react-router-dom';

const ExpenseEdit: FC = () => {
  const { id } = useParams();
  const { isFetching, data } = useExpense(id);

  if (isFetching) {
    return null;
  }

  return (
    <ExpenseEditForm
      initialData={{
        amount: data ? data.amount.toString() : '',
        category: data?.category_id || null,
        description: data?.description || '',
        title: data?.title || '',
        transaction_date: data ? new Date(data.transaction_date) : new Date(),
      }}
    />
  );
};

export default ExpenseEdit;
