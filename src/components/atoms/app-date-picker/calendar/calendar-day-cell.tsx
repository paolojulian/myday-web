import { FC } from 'react';
import { cva } from 'class-variance-authority';
import cn from '@/utils/cn';
import { CalendarDay } from '../hooks/use-calendar-state';
import dayjs from 'dayjs';

type CalendarDayCellProps = {
  day: CalendarDay;
  onClick: (date: Date) => void;
};

const dayCellVariants = cva(
  'h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all',
  {
    variants: {
      isCurrentMonth: {
        true: 'text-black',
        false: 'text-neutral-400',
      },
      isSelected: {
        true: 'bg-black text-white font-semibold scale-105',
        false: '',
      },
      isToday: {
        true: 'ring-1 ring-neutral-400',
        false: '',
      },
    },
    compoundVariants: [
      {
        isSelected: false,
        isCurrentMonth: true,
        className: 'hover:bg-neutral-100 active:scale-95',
      },
    ],
  }
);

const CalendarDayCell: FC<CalendarDayCellProps> = ({ day, onClick }) => {
  return (
    <button
      type='button'
      onClick={() => onClick(day.date)}
      className={cn(
        dayCellVariants({
          isCurrentMonth: day.isCurrentMonth,
          isSelected: day.isSelected,
          isToday: day.isToday,
        })
      )}
    >
      {dayjs(day.date).date()}
    </button>
  );
};

export default CalendarDayCell;
