import CategoryField from '@/components/organisms/expense-form/category-field';
import DescriptionField from '@/components/organisms/expense-form/description-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import { ExpenseRefundToggle } from '@/components/organisms/expense-form/expense-refund-toggle';
import { RecurringMonthlyToggle } from '@/components/organisms/expense-form/recurring-monthly-toggle';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import { useCategories } from '@/hooks/categories/use-categories';
import { useDeleteExpense } from '@/hooks/expenses/use-delete-expense';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { useUpdateExpense } from '@/hooks/expenses/use-update-expense';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { ExpenseRecurrence } from '@/repository/expense.db';
import { UpdateExpenseParams } from '@/services/expense-service/expense.service';
import { FC, useRef, useState } from 'react';
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
  initialRecurrence?: ExpenseRecurrence | null;
};

const ExpenseEditForm: FC<ExpenseEditFormProps> = ({
  expenseId,
  initialData,
  initialRecurrence,
}) => {
  const navigate = useNavigate();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { data: categories } = useCategories();

  const { handleSubmit, control, errors } = useExpenseForm({
    defaultValues: initialData,
  });

  const [isNegative, setIsNegative] = useState(() => {
    if (!initialData?.amount) return false;
    const n = Number(initialData.amount.toString().replace(/[^0-9.-]/g, ''));
    return n < 0;
  });

  const [isRecurring, setIsRecurring] = useState(
    initialRecurrence === ExpenseRecurrence.Monthly
  );

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const title =
      data.title.trim() ||
      categories.find((c) => c.id === data.category)?.name ||
      '';

    const formData: UpdateExpenseParams = {
      id: expenseId,
      title,
      amount: isNegative
        ? -Math.abs(Number(cleanAmount))
        : Math.abs(Number(cleanAmount)),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: isRecurring ? ExpenseRecurrence.Monthly : null,
      recurrence_id: null,
    };

    updateExpense.execute(formData);
    navigate(-1);
  };

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
      <div className='px-4 pt-6 pb-2'>
        <p className='text-2xl font-bold text-neutral-900'>Edit Expense</p>
      </div>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className='flex flex-col gap-2 flex-1 pb-24 px-4 pt-4'
      >
        <ExpenseRefundToggle
          onToggle={(value) => setIsNegative(value === 'refund')}
          value={isNegative ? 'refund' : 'expense'}
        />

        <CategoryField
          onFocusDescriptionInput={focusDescriptionInput}
          control={control}
        />

        <TransactionAmountField
          onSubmitEditing={() => titleInputRef.current?.focus()}
          control={control}
          amountInputRef={amountInputRef}
          errorMessage={errors.amount?.message}
        />

        <TitleField
          onSubmitEditing={() => descriptionInputRef.current?.focus()}
          titleInputRef={titleInputRef}
          errorMessage={errors.title?.message}
          control={control}
        />

        <TransactionDateField control={control} />

        <DescriptionField
          control={control}
          descriptionInputRef={descriptionInputRef}
        />

        <RecurringMonthlyToggle
          value={isRecurring}
          onToggle={setIsRecurring}
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
