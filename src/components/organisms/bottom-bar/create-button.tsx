import { FC, useState } from 'react';
import AppBottomSheet from '../../atoms/app-bottom-sheet';
import AppButton from '../../atoms/app-button';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type CreateButtonProps = {};

const CreateButton: FC<CreateButtonProps> = () => {
  const [shouldOpenForm, setShouldOpenForm] = useState<boolean>(false);

  // const createExpense = useCreateExpense();

  const handleClickAdd = () => {
    // createExpense.mutate({
    //   amount: 100,
    //   title: 'Test',
    //   transaction_date: new Date(),
    //   description: 'Testing Description',
    //   category_id: null,
    //   recurrence: null,
    //   recurrence_id: null,
    // });

    setShouldOpenForm(true);
  };

  const handleCloseForm = () => setShouldOpenForm(false);

  return (
    <>
      <AppButton
        onClick={handleClickAdd}
        className='h-full aspect-square rounded-full border border-black active:scale-95 transition-colors'
      >
        +
      </AppButton>
      <AppBottomSheet onClose={handleCloseForm} isOpen={shouldOpenForm}>
        Test
      </AppBottomSheet>
    </>
  );
};

export default CreateButton;
