import { AppTypography } from '@/components/atoms';
import XIcon from '@/components/atoms/icons/x-icon';
import TrashIcon from '@/components/atoms/icons/trash-icon';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
};

const ExpenseFormFooter = ({ onCancel, onSubmit, onDelete }: Props) => {
  return (
    <div
      className='fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4'
      style={{
        marginBottom: 'var(--safe-area-inset-bottom)',
        marginLeft: 'var(--safe-area-inset-left)',
        marginRight: 'var(--safe-area-inset-right)',
      }}
    >
      <div className='flex flex-row justify-between items-center gap-4'>
        <button
          onClick={onCancel}
          type='button'
          className='w-14 h-14 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 active:scale-95 transition-all'
          aria-label='Cancel'
        >
          <XIcon className='w-6 h-6 text-neutral-800' />
        </button>
        <div className='flex gap-3 flex-1 justify-end'>
          {onDelete && (
            <button
              onClick={onDelete}
              type='button'
              className='w-14 h-14 rounded-full border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all'
              aria-label='Delete'
            >
              <TrashIcon className='w-6 h-6 text-red-600' />
            </button>
          )}
          <button
            onClick={onSubmit}
            type='button'
            className='w-fit px-6 h-14 rounded-full bg-orange-400 text-white flex items-center gap-2 justify-center hover:bg-neutral-800 active:scale-95 transition-all'
            aria-label='Save'
          >
            <AppTypography className='text-white'>Update Expense</AppTypography>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFormFooter;
