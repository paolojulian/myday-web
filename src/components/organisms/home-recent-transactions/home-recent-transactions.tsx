import AppDelayLoader from '@/components/atoms/app-delay-loader';
import AppTypography from '@/components/atoms/app-typography';
import { toCurrency } from '@/lib/currency.utils';
import { getHumanReadableDate } from '@/lib/dates.utils';
import { ExpenseWithCategory } from '@/services/expense-service/expense.service';
import { FC } from 'react';

type Props = {
  recentTransactions: ExpenseWithCategory[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

const HomeRecentTransactions: FC<Props> = ({
  recentTransactions,
  isLoading,
  error,
}) => {
  return (
    <div className='py-4 text-left'>
      <AppTypography variant='heading' className='mb-4'>
        Recent Transactions
      </AppTypography>
      <div className='flex flex-col gap-2'>
        {isLoading ? (
          <AppDelayLoader>
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                Loading...
              </AppTypography>
            </div>
          </AppDelayLoader>
        ) : null}

        {error ? (
          <div className='text-center py-8'>
            <AppTypography variant='body2' className='text-red-500'>
              Error: {error.message}
            </AppTypography>
          </div>
        ) : null}

        {recentTransactions !== undefined &&
          recentTransactions.length === 0 &&
          !isLoading && (
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                No recent transactions
              </AppTypography>
            </div>
          )}

        {recentTransactions?.map((recentTransaction) => (
          <Item
            key={recentTransaction.id}
            title={recentTransaction.title}
            subtitle={recentTransaction.description || ''}
            amount={recentTransaction.amount}
            transactionDate={recentTransaction.transaction_date}
            category={recentTransaction.category?.name}
          />
        ))}
      </div>
    </div>
  );
};

const Item = ({
  title,
  subtitle,
  amount,
  transactionDate,
  category,
}: {
  title: string;
  subtitle: string;
  amount: number;
  transactionDate: Date;
  category?: string;
}) => {
  return (
    <div className='flex flex-row items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-4 hover:bg-neutral-100 transition-colors'>
      <div className='flex-1'>
        <div className='mb-1'>
          <AppTypography
            variant='body'
            className='font-semibold text-neutral-900'
          >
            {title}
          </AppTypography>
        </div>
        {subtitle && (
          <AppTypography variant='small' className='text-neutral-600 mb-1'>
            {subtitle}
          </AppTypography>
        )}
        <AppTypography variant='small' className='text-neutral-500'>
          {getHumanReadableDate(transactionDate)}
        </AppTypography>
      </div>
      <div className='ml-4 flex flex-col items-end'>
        <AppTypography variant='body' className='font-bold text-neutral-900'>
          {toCurrency(amount)}
        </AppTypography>
        {category && (
          <div className='mt-1'>
            <span className='inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium'>
              {category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeRecentTransactions;
