import { useForm } from 'react-hook-form';

export type ExpenseFormData = {
  title: string;
  category: string | null;
  amount: string;
  description: string;
  transaction_date: Date;
};

type Params = {
  defaultValues?: Partial<ExpenseFormData>;
};

const getDefaultValue = (): ExpenseFormData => ({
  title: '',
  category: null,
  amount: '',
  description: '',
  transaction_date: new Date(),
});

export const useExpenseForm = ({ defaultValues }: Params = {}) => {
  const resolvedDefaultValues: ExpenseFormData = {
    ...getDefaultValue(),
    ...defaultValues,
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    mode: 'onBlur',
    defaultValues: resolvedDefaultValues,
  });

  return {
    handleSubmit,
    control,
    errors,
  };
};
