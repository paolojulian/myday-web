import { FC } from 'react';
import { AppButton } from '@/components/atoms';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type CreateButtonProps = {};

const CreateButton: FC<CreateButtonProps> = () => {
  const navigate = useNavigate();

  const handleClickAdd = () => {
    navigate('/expense/add');
  };

  return (
    <AppButton
      onClick={handleClickAdd}
      className='h-full aspect-square rounded-full border border-black active:scale-95 transition-colors'
    >
      +
    </AppButton>
  );
};

export default CreateButton;
