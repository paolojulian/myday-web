import {
  AppBottomSheet,
  AppSegmentedControl,
  AppTypography,
  ThreeWayDatePicker,
} from '@/components/atoms';
import { AppPicker } from '@/components/atoms/app-picker';
import { AppTextArea } from '@/components/atoms/app-text-area';
import AppTextInput from '@/components/atoms/app-text-input';
import XIcon from '@/components/atoms/icons/x-icon';
import { ComponentProps, FC, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

type FormData = {
  title: string;
  category: string;
  amount: string;
  description: string;
  transaction_date: Date;
};

const CATEGORY_OPTIONS = [
  { label: 'Food & Dining', value: 'food' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Bills & Utilities', value: 'bills' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Education', value: 'education' },
  { label: 'Personal Care', value: 'personal' },
  { label: 'Others', value: 'others' },
];

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const { register, handleSubmit, reset, control } = useForm<FormData>({
    defaultValues: {
      title: '',
      category: '',
      amount: '',
      description: '',
      transaction_date: new Date(),
    },
  });

  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (data: FormData) => {
    // Remove ₱ symbol and parse amount
    const cleanAmount = data.amount.replace(/[₱\s,]/g, '').trim();

    onSubmit({
      title: data.title,
      amount: Number(cleanAmount),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });
  };

  const formatCurrency = (value: string): string => {
    // Remove any existing ₱ symbols, spaces, and commas, but keep decimal point and numbers
    const numericValue = value.replace(/[₱\s,]/g, '');

    if (!numericValue || numericValue === '') {
      return '';
    }

    // Allow typing decimal point
    if (numericValue === '.') {
      return '₱ 0.';
    }

    // Check if it ends with a decimal point (user is about to type decimals)
    const endsWithDecimal = numericValue.endsWith('.');

    // Split by decimal to handle integer and decimal parts separately
    const parts = numericValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part with commas
    const number = parseInt(integerPart || '0', 10);
    if (isNaN(number)) {
      return '';
    }

    let formatted = `₱ ${number.toLocaleString('en-US')}`;

    // Add decimal point and decimal digits if present
    if (endsWithDecimal) {
      formatted += '.';
    } else if (decimalPart !== undefined) {
      // Limit to 2 decimal places
      formatted += '.' + decimalPart.slice(0, 2);
    }

    return formatted;
  };

  useEffect(() => {
    reset();

    // Auto-focus title input when modal opens
    if (isOpen) {
      // Use setTimeout to ensure the modal is fully rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, reset]);

  return (
    <AppBottomSheet isOpen={isOpen} {...props} shouldHideHeader height='100%'>
      <div className='flex flex-col h-full -m-4'>
        <div className='px-4 pt-4'>
          <AppSegmentedControl
            options={[
              { label: 'Expense', value: 'expense' },
              { label: 'To Buy', value: 'to-buy' },
            ]}
            activeValue='expense'
            onChange={() => {}}
            className='mb-4'
          />
        </div>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='flex flex-col gap-2 flex-1 pb-24 px-4'
        >
          {/* title */}
          <section>
            <AppTextInput
              id='title'
              label='Title'
              placeholder='Type here..'
              {...register('title')}
              ref={titleInputRef}
            />
          </section>

          {/* transaction amount */}
          <section>
            <AppTextInput
              id='amount'
              label='Amount'
              placeholder='₱ 0.00'
              type='text'
              inputMode='decimal'
              formatter={formatCurrency}
              {...register('amount')}
            />
          </section>

          {/* category */}
          <section>
            <Controller
              name='category'
              control={control}
              render={({ field }) => (
                <AppPicker
                  id='category'
                  label='Category (Optional)'
                  placeholder='Select or create a category'
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  allowCustom
                  searchPlaceholder='Search categories...'
                />
              )}
            />
          </section>

          {/* transaction date */}
          <section>
            <Controller
              name='transaction_date'
              control={control}
              render={({ field }) => (
                <ThreeWayDatePicker
                  value={field.value}
                  onDateChanged={field.onChange}
                />
              )}
            />
          </section>

          {/* recurring */}
          <section></section>

          {/* description */}
          <section>
            <AppTextArea
              id='description'
              label='Description (Optional)'
              placeholder='Type here...'
              rows={4}
              {...register('description')}
            />
          </section>
        </form>

        {/* Fixed bottom buttons with gradient */}
        <div className='fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4'>
          <div className='flex flex-row justify-between items-center gap-4'>
            <button
              onClick={props.onClose}
              type='button'
              className='w-14 h-14 rounded-full border border-orange-200 bg-white flex items-center justify-center hover:bg-neutral-50 active:scale-95 transition-all'
              aria-label='Cancel'
            >
              <XIcon className='w-6 h-6 text-orange-500' />
            </button>
            <button
              onClick={handleSubmit(handleFormSubmit)}
              type='button'
              className='w-fit px-6 h-14 rounded-full bg-black text-white flex items-center gap-2 justify-center hover:bg-neutral-800 active:scale-95 transition-all'
              aria-label='Save'
            >
              <AppTypography>Add Expense</AppTypography>
              {/* <CheckIcon className='w-6 h-6' /> */}
            </button>
          </div>
        </div>
      </div>
    </AppBottomSheet>
  );
};

export default ModalExpenseAdd;
