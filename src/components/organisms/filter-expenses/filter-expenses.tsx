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
    <div className='flex flex-row gap-4 w-full justify-center'>
      <button onClick={handlePrevClicked}>Prev</button>
      <div>{formattedDate}</div>
      <button onClick={handleNextClicked}>Next</button>
    </div>
  );
};

export default FilterExpenses;
