import { AppTextArea } from '@/components/atoms/app-text-area';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import React from 'react';
import { Control, Controller } from 'react-hook-form';

type Props = {
  control: Control<ExpenseFormData>;
  descriptionInputRef: React.RefObject<HTMLTextAreaElement | null>;
  errorMessage?: string;
};

const DescriptionField = ({
  control,
  descriptionInputRef,
  errorMessage,
}: Props) => {
  return (
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
            errorMessage={errorMessage}
            enterKeyHint='done'
          />
        )}
      />
    </section>
  );
};

export default DescriptionField;
