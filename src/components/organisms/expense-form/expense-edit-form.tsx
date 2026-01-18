import { type AppPickerRef } from '@/components/atoms/app-picker';
import { AppTypography } from '@/components/atoms';
import TrashIcon from '@/components/atoms/icons/trash-icon';
import CategoryField from '@/components/organisms/expense-form/category-field';
import DescriptionField from '@/components/organisms/expense-form/description-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { useUpdateExpense } from '@/hooks/expenses/use-update-expense';
import { useDeleteExpense } from '@/hooks/expenses/use-delete-expense';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { UpdateExpenseParams } from '@/services/expense-service/expense.service';
import { FC, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type FormData = {
  title: string;
  category: string | null;
  amount: string;
  description: string;
  transaction_date: Date;
};

type ExpenseEditFormProps = {
  expenseId: number;
  initialData?: FormData;
};

const ExpenseEditForm: FC<ExpenseEditFormProps> = ({
  expenseId,
  initialData,
}) => {
  const navigate = useNavigate();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const { handleSubmit, control, errors } = useExpenseForm({
    defaultValues: initialData,
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categoryPickerRef = useRef<AppPickerRef>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const formData: UpdateExpenseParams = {
      id: expenseId.toString(),
      title: data.title,
      amount: Number(cleanAmount),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: null,
      recurrence_id: null,
    };

    updateExpense.mutate(formData);
    navigate(-1);
  };

  const focusDescriptionInput = () => {
    return setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    // Auto-focus title input when page loads
    const timeout = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense.mutate(expenseId.toString());
      navigate(-1);
    }
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      <div className='px-4 pt-4 pb-4 flex items-center justify-between'>
        <AppTypography variant='heading'>
          Edit Expense
        </AppTypography>
        <button
          onClick={handleDelete}
          type='button'
          className='p-2 hover:bg-red-50 rounded-full active:scale-95 transition-all'
          aria-label='Delete expense'
        >
          <TrashIcon className='w-6 h-6 text-red-600' />
        </button>
      </div>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='flex flex-col gap-2 flex-1 pb-24 px-4'
      >
        {/* title */}
        <TitleField
          onSubmitEditing={() => amountInputRef.current?.focus()}
          titleInputRef={titleInputRef}
          errorMessage={errors.title?.message}
          control={control}
        />

        {/* transaction amount */}
        <TransactionAmountField
          onSubmitEditing={() => categoryPickerRef.current?.open()}
          control={control}
          amountInputRef={amountInputRef}
          errorMessage={errors.amount?.message}
        />

        {/* category */}
        <CategoryField
          onFocusDescriptionInput={focusDescriptionInput}
          control={control}
          categoryPickerRef={categoryPickerRef}
        />

        {/* transaction date */}
        <TransactionDateField control={control} />

        {/* recurring */}
        {/* <section></section> */}

        {/* description */}
        <DescriptionField
          control={control}
          descriptionInputRef={descriptionInputRef}
        />
      </form>

      {/* Fixed bottom buttons with gradient */}
      <ExpenseFormFooter
        onCancel={handleCancel}
        onSubmit={handleSubmit(handleFormSubmit)}
      />
    </div>
  );
};

export default ExpenseEditForm;
