import CategoryField from '@/components/organisms/expense-form/category-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import { ExpenseRefundToggle } from '@/components/organisms/expense-form/expense-refund-toggle';
import { RecurringMonthlyToggle } from '@/components/organisms/expense-form/recurring-monthly-toggle';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import WarrantyField from '@/components/organisms/expense-form/warranty-field';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateExpense } from '@/hooks/expenses/use-create-expense';
import { useCreateWarranty } from '@/hooks/warranties/use-create-warranty';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { AddExpenseParams } from '@/services/expense-service/expense.service';
import { ExpenseRecurrence } from '@/repository/expense.db';
import { FC, useRef, useState } from 'react';
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
  const createWarranty = useCreateWarranty();
  const { data: categories } = useCategories();
  const [isNegative, setIsNegative] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [warrantyImage, setWarrantyImage] = useState<File | null>(null);
  const [warrantyExpiration, setWarrantyExpiration] = useState<Date | null>(
    null
  );

  const { handleSubmit, control, errors } = useExpenseForm();

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const title =
      data.title.trim() ||
      categories.find((c) => c.id === data.category)?.name ||
      '';

    // Persist the warranty first (offline-first) so we can link it to the expense.
    let warranty_id: string | null = null;
    if (warrantyImage) {
      const warranty = await createWarranty.execute({
        title,
        expiration_date: warrantyExpiration,
        imageFile: warrantyImage,
      });
      warranty_id = warranty.id ?? null;
    }

    const formData: AddExpenseParams = {
      title,
      amount: isNegative
        ? -Math.abs(Number(cleanAmount))
        : Math.abs(Number(cleanAmount)),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: isRecurring ? ExpenseRecurrence.Monthly : null,
      recurrence_id: null,
      warranty_id,
    };

    await createExpense.execute(formData);
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

        <RecurringMonthlyToggle
          value={isRecurring}
          onToggle={setIsRecurring}
        />

        <WarrantyField
          imageFile={warrantyImage}
          expirationDate={warrantyExpiration}
          onImageChange={setWarrantyImage}
          onExpirationChange={setWarrantyExpiration}
        />
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
