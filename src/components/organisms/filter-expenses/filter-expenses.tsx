import { FC, useMemo } from 'react';
import {
  getDateFormat,
  getNextMonth,
  getPreviousMonth,
  isSameYearAsToday,
} from '../../../lib/dates.utils';

type FilterExpensesProps = {
  onChangeTransactionDate: (date: Date) => void;
  transactionDate: Date;
};

const FilterExpenses: FC<FilterExpensesProps> = ({
  onChangeTransactionDate,
  transactionDate,
}) => {
  const formattedDate = useMemo(() => {
    if (isSameYearAsToday(transactionDate)) {
      return getDateFormat(transactionDate, 'MMM');
    }

    return getDateFormat(transactionDate, 'MMM YYYY');
  }, [transactionDate]);

  const handlePrevClicked = () => {
    const prevMonth = getPreviousMonth(transactionDate);
    onChangeTransactionDate(prevMonth);
  };

  const handleNextClicked = () => {
    const nextMonth = getNextMonth(transactionDate);
    onChangeTransactionDate(nextMonth);
  };

  return (
    <div className='flex items-center justify-between w-full mt-2 mb-1'>
      <button
        onClick={handlePrevClicked}
        className='p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors'
        aria-label='Previous month'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='15 18 9 12 15 6' />
        </svg>
      </button>

      <span className='text-sm font-semibold text-neutral-700'>{formattedDate}</span>

      <button
        onClick={handleNextClicked}
        className='p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors'
        aria-label='Next month'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='9 18 15 12 9 6' />
        </svg>
      </button>
    </div>
  );
};

export default FilterExpenses;
