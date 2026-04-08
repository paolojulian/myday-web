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
  const hasYear = !isSameYearAsToday(transactionDate);

  const formattedDate = useMemo(() => {
    if (!hasYear) {
      return getDateFormat(transactionDate, 'MMMM');
    }
    return getDateFormat(transactionDate, 'MMMM YYYY');
  }, [transactionDate, hasYear]);

  const handlePrevClicked = () => {
    navigator.vibrate?.(8);
    onChangeTransactionDate(getPreviousMonth(transactionDate));
  };

  const handleNextClicked = () => {
    navigator.vibrate?.(8);
    onChangeTransactionDate(getNextMonth(transactionDate));
  };

  return (
    <div
      className='fixed bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-neutral-900 text-white rounded-full px-2 py-1.5 shadow-xl shadow-neutral-900/30'
      style={{ bottom: 'calc(var(--safe-area-inset-bottom) + 5rem)' }}
    >
      <button
        onClick={handlePrevClicked}
        className='p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all'
        aria-label='Previous month'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='15 18 9 12 15 6' />
        </svg>
      </button>

      <span className={`text-sm font-semibold px-2 whitespace-nowrap text-center ${hasYear ? 'w-36' : 'w-24'}`}>
        {formattedDate}
      </span>

      <button
        onClick={handleNextClicked}
        className='p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all'
        aria-label='Next month'
      >
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <polyline points='9 18 15 12 9 6' />
        </svg>
      </button>
    </div>
  );
};

export default FilterExpenses;
