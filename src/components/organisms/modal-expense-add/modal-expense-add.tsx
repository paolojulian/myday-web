import {
  AppBottomSheet,
  AppSegmentedControl,
  ThreeWayDatePicker,
} from '@/components/atoms';
import AppTextInput from '@/components/atoms/app-text-input';
import { ComponentProps, FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

type FormData = {
  title: string;
  category: string;
  amount: string;
  description: string;
};

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    defaultValues: {
      title: '',
      category: '',
      amount: '',
      description: '',
    },
  });

  const amountValue = watch('amount');

  const handleFormSubmit = (data: FormData) => {
    // Remove ₱ symbol and parse amount
    const cleanAmount = data.amount.replace('₱', '').trim();

    onSubmit({
      title: data.title,
      amount: Number(cleanAmount),
      transaction_date: new Date(),
      description: data.description,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });
  };

  const handleAmountChange = (value?: string | number) => {
    const stringValue = String(value || '');
    // Remove any existing ₱ symbols and non-numeric characters except decimal point
    const numericValue = stringValue.replace(/[₱\s]/g, '');

    if (numericValue) {
      setValue('amount', `₱ ${numericValue}`);
    } else {
      setValue('amount', '');
    }
  };

  useEffect(() => {
    reset();
  }, [isOpen, reset]);

  return (
    <AppBottomSheet isOpen={isOpen} {...props} shouldHideHeader>
      <AppSegmentedControl
        options={[
          { label: 'Expense', value: 'expense' },
          { label: 'To Buy', value: 'to-buy' },
        ]}
        activeValue='expense'
        onChange={() => {}}
        className='mb-4'
      />
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='flex flex-col gap-2'
      >
        {/* title */}
        <section>
          <AppTextInput
            id='title'
            label='Title'
            placeholder='Type here..'
            {...register('title')}
          />
        </section>

        {/* transaction amount */}
        <section>
          <AppTextInput
            id='amount'
            label='Amount'
            placeholder='₱ 0.00'
            type='number'
            value={amountValue}
            onChangeText={handleAmountChange}
          />
        </section>

        {/* category */}
        <section>
          <AppTextInput
            id='category'
            label='Category (Optional)'
            placeholder='ex: Restaurant, Grocery...'
            {...register('category')}
          />
        </section>

        {/* transaction date */}
        <section>
          <ThreeWayDatePicker />
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
