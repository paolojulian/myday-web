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
            errorMessage={errorMessage}
            enterKeyHint='next'
            onSubmitEditing={onSubmitEditing}
            autoFocus
          />
        )}
      />
    </section>
  );
};

export default TitleField;
