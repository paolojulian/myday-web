import CategoryField from '@/components/organisms/expense-form/category-field';
import DescriptionField from '@/components/organisms/expense-form/description-field';
import ExpenseFormFooter from '@/components/organisms/expense-form/expense-form-footer';
import { ExpenseRefundToggle } from '@/components/organisms/expense-form/expense-refund-toggle';
import { RecurringMonthlyToggle } from '@/components/organisms/expense-form/recurring-monthly-toggle';
import TitleField from '@/components/organisms/expense-form/title-field';
import TransactionAmountField from '@/components/organisms/expense-form/transaction-amount-field';
import TransactionDateField from '@/components/organisms/expense-form/transaction-date-field';
import WarrantyField from '@/components/organisms/expense-form/warranty-field';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCancelRecurrence } from '@/hooks/expenses/use-cancel-recurrence';
import { useDeleteExpense } from '@/hooks/expenses/use-delete-expense';
import { useExpenseForm } from '@/hooks/expenses/use-expense-form';
import { useUpdateExpense } from '@/hooks/expenses/use-update-expense';
import { useCreateWarranty } from '@/hooks/warranties/use-create-warranty';
import { useUpdateWarranty } from '@/hooks/warranties/use-update-warranty';
import { useDeleteWarranty } from '@/hooks/warranties/use-delete-warranty';
import { useWarrantyLive } from '@/hooks/warranties/use-warranty-live';
import { clearCurrencyFormatting } from '@/lib/formatters.utils';
import { ExpenseRecurrence } from '@/repository/expense.db';
import { UpdateExpenseParams } from '@/services/expense-service/expense.service';
import { resolveRecurrenceFields } from '@/services/recurring-expense-service/recurring-expense.service';
import { FC, useEffect, useRef, useState } from 'react';
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
  initialRecurrenceId?: string | null;
  initialWarrantyId?: string | null;
};

const ExpenseEditForm: FC<ExpenseEditFormProps> = ({
  expenseId,
  initialData,
  initialRecurrence,
  initialRecurrenceId = null,
  initialWarrantyId = null,
}) => {
  const navigate = useNavigate();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const cancelRecurrence = useCancelRecurrence();
  const createWarranty = useCreateWarranty();
  const updateWarranty = useUpdateWarranty();
  const deleteWarranty = useDeleteWarranty();
  const { data: existingWarranty } = useWarrantyLive(initialWarrantyId);
  const { data: categories } = useCategories();

  const [warrantyImage, setWarrantyImage] = useState<File | null>(null);
  const [warrantyExpiration, setWarrantyExpiration] = useState<Date | null>(
    null
  );
  const [warrantyRemoved, setWarrantyRemoved] = useState(false);

  // Seed the expiration from the loaded warranty exactly once.
  const didSeedWarranty = useRef(false);
  useEffect(() => {
    if (didSeedWarranty.current || !existingWarranty) return;
    didSeedWarranty.current = true;
    setWarrantyExpiration(existingWarranty.expiration_date ?? null);
  }, [existingWarranty]);

  const { handleSubmit, control, errors } = useExpenseForm({
    defaultValues: initialData,
  });

  const [isNegative, setIsNegative] = useState(() => {
    if (!initialData?.amount) return false;
    const n = Number(initialData.amount.toString().replace(/[^0-9.-]/g, ''));
    return n < 0;
  });

  // An auto-generated instance carries `recurrence_id` but no `recurrence`, so
  // both signals must be checked for the toggle to reflect a recurring expense.
  const isInstance = !!initialRecurrenceId;
  const [isRecurring, setIsRecurring] = useState(
    initialRecurrence === ExpenseRecurrence.Monthly || isInstance
  );

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Resolves the warranty link based on what the user did:
  //  - picked a new image  → replace (delete old) and create a fresh warranty
  //  - removed the receipt → delete and unlink
  //  - only changed expiry → update the existing warranty in place
  const resolveWarranty = async (title: string): Promise<string | null> => {
    if (warrantyImage) {
      if (existingWarranty?.id) await deleteWarranty.execute(existingWarranty.id);
      const warranty = await createWarranty.execute({
        title,
        expiration_date: warrantyExpiration,
        imageFile: warrantyImage,
      });
      return warranty.id ?? null;
    }

    if (warrantyRemoved) {
      if (existingWarranty?.id) await deleteWarranty.execute(existingWarranty.id);
      return null;
    }

    if (existingWarranty?.id) {
      await updateWarranty.execute({
        id: existingWarranty.id,
        title,
        expiration_date: warrantyExpiration,
      });
      return existingWarranty.id;
    }

    return initialWarrantyId;
  };

  const handleFormSubmit = async (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const title =
      data.title.trim() ||
      categories.find((c) => c.id === data.category)?.name ||
      '';

    const { recurrence, recurrence_id } = resolveRecurrenceFields({
      isRecurring,
      recurrenceId: initialRecurrenceId,
    });

    const warranty_id = await resolveWarranty(title);

    const formData: UpdateExpenseParams = {
      id: expenseId,
      title,
      amount: isNegative
        ? -Math.abs(Number(cleanAmount))
        : Math.abs(Number(cleanAmount)),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence,
      recurrence_id,
      warranty_id,
    };

    await updateExpense.execute(formData);

    // Cancelling recurrence on an instance must also stop its parent template,
    // otherwise the series keeps generating new instances next period.
    if (!isRecurring && isInstance && initialRecurrenceId) {
      await cancelRecurrence.execute(initialRecurrenceId);
    }

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
          description={
            isInstance
              ? 'Part of a monthly series — turn off to stop it recurring'
              : undefined
          }
        />

        <WarrantyField
          imageFile={warrantyImage}
          expirationDate={warrantyExpiration}
          existingImageUrl={warrantyRemoved ? null : existingWarranty?.image_url}
          existingImageBlob={warrantyRemoved ? null : existingWarranty?.image_blob}
          onImageChange={(file) => {
            setWarrantyImage(file);
            if (file) setWarrantyRemoved(false);
          }}
          onExpirationChange={setWarrantyExpiration}
          onRemove={() => setWarrantyRemoved(true)}
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
