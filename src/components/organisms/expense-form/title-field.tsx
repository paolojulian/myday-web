import AppTextInput from '@/components/atoms/app-text-input';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import { Control, Controller } from 'react-hook-form';

type Props = {
  onSubmitEditing: () => void;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  errorMessage?: string;
  control: Control<ExpenseFormData>;
};

const TitleField = ({
  onSubmitEditing,
  titleInputRef,
  errorMessage,
  control,
}: Props) => {
  return (
    <section>
      <Controller
        name='title'
        control={control}
        rules={{
          maxLength: {
            value: 100,
            message: 'Title must not exceed 100 characters',
          },
        }}
        render={({ field }) => (
          <AppTextInput
            id='title'
            label='Title (Optional)'
            placeholder='Type here..'
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={titleInputRef}
            errorMessage={errorMessage}
            enterKeyHint='next'
            onSubmitEditing={onSubmitEditing}
          />
        )}
      />
    </section>
  );
};

export default TitleField;
