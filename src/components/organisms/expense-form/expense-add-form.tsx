import { type AppPickerRef } from '@/components/atoms/app-picker';
import CategoryField from '@/components/organisms/expense-form/category-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import { ExpenseRefundToggle } from '@/components/organisms/expense-form/expense-refund-toggle';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateExpense } from '@/hooks/expenses/use-create-expense';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { AddExpenseParams } from '@/services/expense-service/expense.service';
import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type FormData = {
  title: string;
  category: string | null;
  amount: string;
  description: string;
  transaction_date: Date;
};

const ExpenseAddForm: FC = () => {
  const navigate = useNavigate();
  const createExpense = useCreateExpense();
  const { data: categories } = useCategories();
  const [isNegative, setIsNegative] = useState(false);

  const { handleSubmit, control, errors } = useExpenseForm();

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categoryPickerRef = useRef<AppPickerRef>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const title =
      data.title.trim() ||
      categories.find((c) => c.id === data.category)?.name ||
      '';

    const formData: AddExpenseParams = {
      title,
      amount: isNegative
        ? -Math.abs(Number(cleanAmount))
        : Math.abs(Number(cleanAmount)),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: null,
      recurrence_id: null,
    };

    createExpense.execute(formData);
    navigate(-1);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      categoryPickerRef.current?.open();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  const focusDescriptionInput = () => {
    return setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 100);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      <div className='px-4 pt-6 pb-2'>
        <p className='text-2xl font-bold text-neutral-900'>Add Expense</p>
      </div>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='flex flex-col gap-2 flex-1 pb-24 px-4 pt-4'
      >
        <ExpenseRefundToggle
          onToggle={(value) => setIsNegative(value === 'refund')}
          value={isNegative ? 'refund' : 'expense'}
        />
        {/* category */}
        <CategoryField
          onFocusDescriptionInput={focusDescriptionInput}
          control={control}
          categoryPickerRef={categoryPickerRef}
        />

        {/* transaction amount */}
        <TransactionAmountField
          onSubmitEditing={() => titleInputRef.current?.focus()}
          control={control}
          amountInputRef={amountInputRef}
          errorMessage={errors.amount?.message}
        />

        {/* title */}
        <TitleField
          onSubmitEditing={() => descriptionInputRef.current?.focus()}
          titleInputRef={titleInputRef}
          errorMessage={errors.title?.message}
          control={control}
        />

        {/* transaction date */}
        <TransactionDateField control={control} />

        {/* description */}
        {/* <DescriptionField
          control={control}
          descriptionInputRef={descriptionInputRef}
        /> */}
      </form>

      <ExpenseFormFooter
        onCancel={handleCancel}
        onSubmit={handleSubmit(handleFormSubmit)}
        submitLabel='Add Expense'
      />
    </div>
  );
};

export default ExpenseAddForm;
