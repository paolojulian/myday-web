import { AppButton } from '@/components/atoms';
import XIcon from '@/components/atoms/icons/x-icon';
import TrashIcon from '@/components/atoms/icons/trash-icon';

type Props = {
  onCancel: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  submitLabel?: string;
};

const ExpenseFormFooter = ({ onCancel, onSubmit, onDelete, submitLabel = 'Update Expense' }: Props) => {
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
        <AppButton variant='outlined' size='icon' onClick={onCancel} type='button' aria-label='Cancel'>
          <XIcon className='w-5 h-5 text-neutral-800' />
        </AppButton>
        <div className='flex gap-3 flex-1 justify-end'>
          {onDelete && (
            <AppButton variant='danger' size='icon' onClick={onDelete} type='button' aria-label='Delete'>
              <TrashIcon className='w-5 h-5' />
            </AppButton>
          )}
          <AppButton variant='primary' size='lg' onClick={onSubmit} type='button' aria-label='Save' className='flex-1'>
            {submitLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFormFooter;
