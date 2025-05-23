import { FC, useState } from 'react';
import { useCreateExpense } from '../../../hooks/expenses/use-create-expense';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';
import ModalExpenseAdd from '../modal-expense-add/modal-expense-add';
import { AppButton } from '@/components/atoms';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type CreateButtonProps = {};

const CreateButton: FC<CreateButtonProps> = () => {
  const [shouldOpenForm, setShouldOpenForm] = useState<boolean>(false);

  const createExpense = useCreateExpense();

  const handleClickAdd = () => {
    setShouldOpenForm(true);
  };

  const handleSubmitExpenseAdd = async (expenseToAdd: AddExpenseParams) => {
    await createExpense.mutate(expenseToAdd);
    setShouldOpenForm(false);
    // TODO: success, error, loading, etc
  };

  const handleCloseForm = () => setShouldOpenForm(false);

  return (
    <>
      <AppButton
        onClick={handleClickAdd}
        className="h-full aspect-square rounded-full border border-black active:scale-95 transition-colors"
      >
        +
      </AppButton>
      <ModalExpenseAdd
        onSubmit={handleSubmitExpenseAdd}
        onClose={handleCloseForm}
        isOpen={shouldOpenForm}
      />
    </>
  );
};

export default CreateButton;
