import AppTextInput from '@/components/atoms/app-text-input';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import {
  clearCurrencyFormatting,
  formatCurrency,
} from '@/lib/formatters.utils';
import { Control, Controller } from 'react-hook-form';

type Props = {
  onSubmitEditing: () => void;
  amountInputRef: React.RefObject<HTMLInputElement | null>;
  control: Control<ExpenseFormData>;
  errorMessage?: string;
  isNegative?: boolean;
  onToggleSign?: (negative: boolean) => void;
};

const TransactionAmountField = ({
  onSubmitEditing,
  amountInputRef,
  control,
  errorMessage,
  isNegative = false,
  onToggleSign,
}: Props) => {
  return (
    <section>
      {/* Expense / Refund toggle */}
      <div className='flex gap-2 mb-2'>
        <button
          type='button'
          onClick={() => onToggleSign?.(false)}
          className={`flex-1 h-9 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            !isNegative
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          Expense
        </button>
        <button
          type='button'
          onClick={() => onToggleSign?.(true)}
          className={`flex-1 h-9 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            isNegative
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          − Refund
        </button>
      </div>

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
            if (numValue === 0) {
              return 'Amount cannot be zero';
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
            errorMessage={errorMessage}
            enterKeyHint='next'
            onSubmitEditing={onSubmitEditing}
          />
        )}
      />
    </section>
  );
};

export default TransactionAmountField;
