import cn from '@/utils/cn';

type Props = {
  value: boolean;
  onToggle: (value: boolean) => void;
};

export const RecurringMonthlyToggle = ({ value, onToggle }: Props) => {
  return (
    <button
      type='button'
      onClick={() => onToggle(!value)}
      className='flex items-center justify-between w-full px-4 py-3 bg-neutral-100 rounded-md active:scale-95 transition-all'
    >
      <span className='text-sm font-medium text-neutral-700'>
        Monthly Recurring
      </span>

      {/* Toggle switch */}
      <div
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          {
            'bg-emerald-500': value,
            'bg-neutral-300': !value,
          }
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            {
              'translate-x-5': value,
              'translate-x-0.5': !value,
            }
          )}
        />
      </div>
    </button>
  );
};
