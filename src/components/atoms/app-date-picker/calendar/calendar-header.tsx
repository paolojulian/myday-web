import { FC } from 'react';
import ChevronLeftIcon from '@/components/atoms/icons/chevron-left-icon';
import ChevronRightIcon from '@/components/atoms/icons/chevron-right-icon';
import { getYear } from '@/lib/dates.utils';
import dayjs from 'dayjs';

type CalendarHeaderProps = {
  currentMonth: Date;
  monthOptions: string[];
  yearOptions: number[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMonthSelect: (month: number) => void;
  onYearSelect: (year: number) => void;
};

const CalendarHeader: FC<CalendarHeaderProps> = ({
  currentMonth,
  monthOptions,
  yearOptions,
  onPreviousMonth,
  onNextMonth,
  onMonthSelect,
  onYearSelect,
}) => {
  const currentMonthIndex = dayjs(currentMonth).month();
  const currentYear = getYear(currentMonth);

  return (
    <div className='flex items-center justify-between gap-2'>
      {/* Previous month button */}
      <button
        type='button'
        onClick={onPreviousMonth}
        className='p-2 rounded-full hover:bg-neutral-100 active:scale-95 transition-all'
        aria-label='Previous month'
      >
        <ChevronLeftIcon className='w-5 h-5 text-neutral-700' />
      </button>

      {/* Month and year selectors */}
      <div className='flex items-center gap-2'>
        {/* Month dropdown */}
        <select
          value={currentMonthIndex}
          onChange={(e) => onMonthSelect(Number(e.target.value))}
          className='px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all'
        >
          {monthOptions.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>

        {/* Year dropdown */}
        <select
          value={currentYear}
          onChange={(e) => onYearSelect(Number(e.target.value))}
          className='px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-all'
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Next month button */}
      <button
        type='button'
        onClick={onNextMonth}
        className='p-2 rounded-full hover:bg-neutral-100 active:scale-95 transition-all'
        aria-label='Next month'
      >
        <ChevronRightIcon className='w-5 h-5 text-neutral-700' />
      </button>
    </div>
  );
};

export default CalendarHeader;
