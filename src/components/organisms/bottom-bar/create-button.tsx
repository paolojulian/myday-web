import { FC } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateButton: FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/expenses/add')}
      className='w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/20 active:scale-95 transition-transform'
      aria-label='Add expense'
    >
      <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M12 5v14M5 12h14' />
      </svg>
    </button>
  );
};

export default CreateButton;
