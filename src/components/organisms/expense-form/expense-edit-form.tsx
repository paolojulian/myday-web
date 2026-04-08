import { type AppPickerRef } from '@/components/atoms/app-picker';
import { AppTypography } from '@/components/atoms';
import CategoryField from '@/components/organisms/expense-form/category-field';
import DescriptionField from '@/components/organisms/expense-form/description-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import { useCategories } from '@/hooks/categories/use-categories';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { useUpdateExpense } from '@/hooks/expenses/use-update-expense';
import { useDeleteExpense } from '@/hooks/expenses/use-delete-expense';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { UpdateExpenseParams } from '@/services/expense-service/expense.service';
import { FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type FormData = {
  title: string;
  category: string | null;
  amount: string;
  description: string;
  transaction_date: Date;
};

type ExpenseEditFormProps = {
  expenseId: string;
  initialData?: FormData;
};

const ExpenseEditForm: FC<ExpenseEditFormProps> = ({
  expenseId,
  initialData,
}) => {
  const navigate = useNavigate();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { data: categories } = useCategories();

  const { handleSubmit, control, errors } = useExpenseForm({
    defaultValues: initialData,
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categoryPickerRef = useRef<AppPickerRef>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const title = data.title.trim() ||
      categories.find((c) => c.id === data.category)?.name ||
      '';

    const formData: UpdateExpenseParams = {
      id: expenseId,
      title,
      amount: Number(cleanAmount),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: null,
      recurrence_id: null,
    };

    updateExpense.execute(formData);
    navigate(-1);
  };

  useEffect(() => {
    if (initialData?.category) return;
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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense.execute(expenseId.toString());
      navigate(-1);
    }
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      <div className='px-4 pt-4 pb-4'>
        <AppTypography variant='heading'>Edit Expense</AppTypography>
      </div>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='flex flex-col gap-2 flex-1 pb-24 px-4'
      >
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
        <DescriptionField
          control={control}
          descriptionInputRef={descriptionInputRef}
        />
      </form>

      <ExpenseFormFooter
        onCancel={handleCancel}
        onSubmit={handleSubmit(handleFormSubmit)}
        onDelete={handleDelete}
        submitLabel='Update Expense'
      />
    </div>
  );
};

export default ExpenseEditForm;
