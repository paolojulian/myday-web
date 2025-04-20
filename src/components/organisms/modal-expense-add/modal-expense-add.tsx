import { ComponentProps, FC } from 'react';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';
import AppBottomSheet from '../../atoms/app-bottom-sheet';

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({ onSubmit, ...props }) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      title: formData.get('title') as string,
      amount: Number(formData.get('amount')),
      transaction_date: new Date(formData.get('transaction_date') as string),
      description: formData.get('description') as string,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });
  };

  return (
    <AppBottomSheet {...props}>
      <form onSubmit={handleSubmit}>
        {/* title */}
        <section>
          <label htmlFor='title'>Title</label>
          <input type='text' id='title' name='title' />
        </section>
        {/* transaction amount */}
        <section></section>
        {/* category */}
        <section></section>
        {/* description */}
        <section></section>

        {/* save */}
        <section>
          <button onClick={props.onClose} type='button'>
            Cancel
          </button>
          <button type='submit'>Save</button>
        </section>
      </form>
    </AppBottomSheet>
  );
};

export default ModalExpenseAdd;
