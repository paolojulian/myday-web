import { AppBottomSheet, AppTypography } from '@/components/atoms';
import AppTextInput from '@/components/atoms/app-text-input';
import XIcon from '@/components/atoms/icons/x-icon';
import { ComponentProps, FC, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  clearCurrencyFormatting,
  formatCurrency,
} from '@/lib/formatters.utils';

type ModalBudgetSetupProps = {
  onSubmit: (amount: number) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, 'children'>;

type FormData = {
  amount: string;
};

const ModalBudgetSetup: FC<ModalBudgetSetupProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      amount: '',
    },
  });

  const amountInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (data: FormData) => {
    const cleanAmount = clearCurrencyFormatting(data.amount);
    onSubmit(Number(cleanAmount));
  };

  useEffect(() => {
    reset();

    // Auto-focus amount input when modal opens
    if (isOpen) {
      const timeout = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [isOpen, reset]);

  return (
    <AppBottomSheet
      isOpen={isOpen}
      {...props}
      shouldHideHeader
      height='auto'
      variant='custom'
      zIndex={1001}
    >
      <div className='flex flex-col -m-4'>
        <div className='px-4 pt-4 pb-2 mb-4'>
          <AppTypography variant='heading'>Set Monthly Budget</AppTypography>
          <AppTypography variant='small' className='text-neutral-600'>
            Enter your total budget for the month to track your spending
          </AppTypography>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className='flex flex-col gap-4 px-4 pb-36'
        >
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
                  label='Monthly Budget'
                  placeholder='₱ 0.00'
                  type='text'
                  inputMode='decimal'
                  formatter={formatCurrency}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={amountInputRef}
                  errorMessage={errors.amount?.message}
                  enterKeyHint='done'
                />
              )}
            />
          </section>
        </form>

        {/* Fixed bottom buttons */}
        <div className='fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4'>
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
              type='submit'
              className='flex-1 px-6 h-14 rounded-full bg-orange-400 text-white flex items-center gap-2 justify-center hover:bg-orange-500 active:scale-95 transition-all'
              aria-label='Save Budget'
            >
              <AppTypography className='text-white font-semibold'>
                Set Budget
              </AppTypography>
            </button>
          </div>
        </div>
      </div>
    </AppBottomSheet>
  );
};

export default ModalBudgetSetup;
