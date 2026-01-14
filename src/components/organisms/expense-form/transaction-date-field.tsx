import { ThreeWayDatePicker } from '@/components/atoms';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import { Control, Controller } from 'react-hook-form';

type Props = {
  control: Control<ExpenseFormData>;
};

const TransactionDateField = ({ control }: Props) => {
  return (
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
  );
};

export default TransactionDateField;
