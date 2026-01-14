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
};

const TransactionAmountField = ({
  onSubmitEditing,
  amountInputRef,
  control,
  errorMessage,
}: Props) => {
  return (
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
