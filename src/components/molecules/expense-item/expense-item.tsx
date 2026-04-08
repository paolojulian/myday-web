import AppTypography from '@/components/atoms/app-typography';
import { toCurrency } from '@/lib/currency.utils';
import { getHumanReadableDate } from '@/lib/dates.utils';
import { ExpenseWithCategory } from '@/services/expense-service/expense.service';
import cn from '@/utils/cn';
import { FC } from 'react';
import { Link } from 'react-router-dom';

type ExpenseItemProps = {
  expense: ExpenseWithCategory;
  showDate?: boolean;
};

const ExpenseItem: FC<ExpenseItemProps> = ({ expense, showDate = false }) => {
  return (
    <Link to={`/expenses/${expense.id}`} className='no-underline'>
      <div className='flex flex-row items-center justify-between bg-neutral-50 rounded-xl p-4 hover:bg-neutral-100 transition-colors'>
        <div className='flex-1'>
          <AppTypography
            variant='body'
            className='font-semibold text-neutral-900'
          >
            {expense.title}
          </AppTypography>
          {expense.description && (
            <AppTypography
              variant='small'
              className='text-neutral-600 line-clamp-2'
            >
              {expense.description}
            </AppTypography>
          )}
          {showDate && (
            <AppTypography variant='small' className='text-neutral-500'>
              {getHumanReadableDate(expense.transaction_date)}
            </AppTypography>
          )}
        </div>
        <div className='ml-4 flex flex-col items-end'>
          <AppTypography variant='body' className='font-bold text-neutral-900'>
            {toCurrency(expense.amount)}
          </AppTypography>
          {expense.category && (
            <span
              className={cn(
                'mt-1 inline-block px-2 py-0.5  rounded-full text-xs font-medium',
                {
                  'bg-emerald-50 text-emerald-700': expense.amount < 0,
                  'bg-red-50 text-red-700': expense.amount > 0,
                }
              )}
            >
              {expense.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ExpenseItem;
