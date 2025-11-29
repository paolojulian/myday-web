import { FC } from 'react';
import dayjs from 'dayjs';
import cn from '@/utils/cn';

type CalendarFooterProps = {
  selectedDate: Date | null;
  onTodayClick: () => void;
  onConfirm: () => void;
};

const CalendarFooter: FC<CalendarFooterProps> = ({
  selectedDate,
  onTodayClick,
  onConfirm,
}) => {
  const formattedDate = selectedDate
    ? dayjs(selectedDate).format('MMM D, YYYY')
    : '';

  return (
    <div className='flex items-center justify-between gap-3 pt-2'>
      {/* Today button */}
      <button
        type='button'
        onClick={onTodayClick}
        className='px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50 active:scale-95 transition-all'
      >
        Today
      </button>

      {/* Confirm button */}
      <button
        type='button'
        onClick={onConfirm}
        disabled={!selectedDate}
        className={cn(
          'flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
          selectedDate
            ? 'bg-black text-white hover:bg-neutral-800 active:scale-95'
            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
        )}
      >
        {selectedDate ? `Proceed with ${formattedDate}` : 'Select a date'}
      </button>
    </div>
  );
};

export default CalendarFooter;
