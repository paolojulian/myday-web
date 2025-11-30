import {
  AppBottomSheet,
  AppSegmentedControl,
  AppTypography,
  ThreeWayDatePicker,
} from '@/components/atoms';
import { AppPicker, type AppPickerRef } from '@/components/atoms/app-picker';
import { AppTextArea } from '@/components/atoms/app-text-area';
import AppTextInput from '@/components/atoms/app-text-input';
import XIcon from '@/components/atoms/icons/x-icon';
import { ComponentProps, FC, useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AddExpenseParams } from '../../../services/expense-service/expense.service';
import {
  clearCurrencyFormatting,
  formatCurrency,
} from '@/lib/formatters.utils';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateCategory } from '@/hooks/categories/use-create-category';

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

type FormData = {
  title: string;
  category: number | null;
  amount: string;
  description: string;
  transaction_date: Date;
};

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();
  const createCategory = useCreateCategory();

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      title: '',
      category: null,
      amount: '',
      description: '',
      transaction_date: new Date(),
    },
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const categoryPickerRef = useRef<AppPickerRef>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Convert categories to picker options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: String(category.id || ''),
    }));
  }, [categories]);

  const handleFormSubmit = (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);

    const formData: AddExpenseParams = {
      title: data.title,
      amount: Number(cleanAmount),
      transaction_date: data.transaction_date,
      description: data.description,
      category_id: data.category || null,
      recurrence: null,
      recurrence_id: null,
    };

    onSubmit(formData);
  };

  const focusDescriptionInput = () => {
    return setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 100);
  };
  const focusTitleInput = () => {
    return setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleCategoryChange = async (
    value: string,
    onChange: (value: number | null) => void
  ) => {
    // Check if this is a new category (not in existing options)
    const numValue: number = Number(value);
    const isExisting: boolean = categories.some((cat) => cat.id === numValue);

    if (!isExisting && value && isNaN(numValue)) {
      // Create new category - value is the category name (not a number)
      createCategory.mutate(
        { name: value },
        {
          onSuccess: (newCategory) => {
            // Set the newly created category ID
            if (newCategory?.id) {
              onChange(newCategory.id);
            }
            focusDescriptionInput();
          },
          onError: (error) => {
            console.error('Failed to create category:', error);
            onChange(null);
          },
        }
      );
      return;
    }

    onChange(numValue || null);
    focusDescriptionInput();
  };

  useEffect(() => {
    reset();

    // Auto-focus title input when modal opens
    if (isOpen) {
      // Use setTimeout to ensure the modal is fully rendered
      const timeout = focusTitleInput();
      return () => {
        clearTimeout(timeout);
      };
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
            <Controller
              name='title'
              control={control}
              rules={{
                required: 'Title is required',
                minLength: {
                  value: 2,
                  message: 'Title must be at least 2 characters',
                },
                maxLength: {
                  value: 100,
                  message: 'Title must not exceed 100 characters',
                },
              }}
              render={({ field }) => (
                <AppTextInput
                  id='title'
                  label='Title'
                  placeholder='Type here..'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={titleInputRef}
                  errorMessage={errors.title?.message}
                  enterKeyHint='next'
                  onSubmitEditing={() => amountInputRef.current?.focus()}
                />
              )}
            />
          </section>

          {/* transaction amount */}
          <section>
            <Controller
              name='amount'
              control={control}
              rules={{
                required: 'Amount is required',
                validate: (value) => {
                  const cleanAmount = clearCurrencyFormatting(value);
                  const numValue = Number(cleanAmount);

                  if (isNaN(numValue)) {
                    return 'Please enter a valid number';
                  }
                  if (numValue <= 0) {
                    return 'Amount must be greater than 0';
                  }
                  if (numValue >= 999999999) {
                    return 'Amount must be less than 999,999,999';
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <AppTextInput
                  id='amount'
                  label='Amount'
                  placeholder='₱ 0.00'
                  type='text'
                  inputMode='decimal'
                  formatter={formatCurrency}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={amountInputRef}
                  errorMessage={errors.amount?.message}
                  enterKeyHint='next'
                  onSubmitEditing={() => categoryPickerRef.current?.open()}
                />
              )}
            />
          </section>

          {/* category */}
          <section>
            <Controller
              name='category'
              control={control}
              render={({ field }) => (
                <AppPicker
                  ref={categoryPickerRef}
                  id='category'
                  label='Category (Optional)'
                  placeholder={
                    isCategoriesLoading
                      ? 'Loading...'
                      : 'Select or create a category'
                  }
                  options={categoryOptions}
                  value={field.value !== null ? String(field.value) : undefined}
                  onChange={(value) =>
                    handleCategoryChange(value, field.onChange)
                  }
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
            <Controller
              name='description'
              control={control}
              rules={{
                maxLength: {
                  value: 500,
                  message: 'Description must not exceed 500 characters',
                },
              }}
              render={({ field }) => (
                <AppTextArea
                  id='description'
                  label='Description (Optional)'
                  placeholder='Type here...'
                  rows={4}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={descriptionInputRef}
                  errorMessage={errors.description?.message}
                  enterKeyHint='done'
                />
              )}
            />
          </section>
        </form>

        {/* Fixed bottom buttons with gradient */}
        <div
          className='fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4'
          style={{
            marginBottom: 'var(--safe-area-inset-bottom)',
            marginLeft: 'var(--safe-area-inset-left)',
            marginRight: 'var(--safe-area-inset-right)',
          }}
        >
          <div className='flex flex-row justify-between items-center gap-4'>
            <button
              onClick={props.onClose}
              type='button'
              className='w-14 h-14 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 active:scale-95 transition-all'
              aria-label='Cancel'
            >
              <XIcon className='w-6 h-6 text-neutral-800' />
            </button>
            <button
              onClick={handleSubmit(handleFormSubmit)}
              type='button'
              className='w-fit px-6 h-14 rounded-full bg-orange-400 text-white flex items-center gap-2 justify-center hover:bg-neutral-800 active:scale-95 transition-all'
              aria-label='Save'
            >
              <AppTypography className='text-white'>Add Expense</AppTypography>
              {/* <CheckIcon className='w-6 h-6' /> */}
            </button>
          </div>
        </div>
      </div>
    </AppBottomSheet>
  );
};

export default ModalExpenseAdd;
