import { AppBottomSheet } from '@/components/atoms';
import { ComponentProps, FC, useEffect, useRef } from 'react';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';
import AppTextInput from '@/components/atoms/app-text-input';

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      title: formData.get('title') as string,
      amount: Number(formData.get('amount')),
      transaction_date: new Date(),
      description: formData.get('description') as string,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });
  };

  useEffect(() => {
    formRef.current?.reset();
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <AppBottomSheet isOpen={isOpen} {...props} title='Add Expense'>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='flex flex-col gap-2'
      >
        {/* title */}
        <section>
          <AppTextInput id='title' label='Title' placeholder="Type here.." />
        </section>

        {/* category */}
        <section></section>

        {/* transaction amount */}
        <section>
          <label htmlFor='amount'>Amount</label>
          <input ref={amountRef} type='number' id='amount' name='amount' />
        </section>

        {/* transaction date */}
        <section className='grid grid-cols-3 gap-2'>
          <div className='p-2 py-4 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2'>
            <div className='size-6 rounded-full bg-neutral-400'></div>
            <p>Today</p>
          </div>
          <div className='p-2 py-4 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2'>
            <div className='size-6 rounded-full bg-neutral-400'></div>
            <p>Tomorrow</p>
          </div>
          <div className='p-2 py-4 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center gap-2'>
            <div className='size-6 rounded-full bg-neutral-400'></div>
            <p>Custom</p>
          </div>
        </section>

        {/* recurring */}
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
