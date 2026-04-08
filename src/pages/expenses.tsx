import { AppPageHeader } from '@/components/atoms';
import AppDelayLoader from '@/components/atoms/app-delay-loader';
import AppTypography from '@/components/atoms/app-typography';
import ExpenseItem from '@/components/molecules/expense-item';
import { FilterExpenses } from '../components/organisms/filter-expenses';
import { useExpensesWithCategoryLive } from '@/hooks/expenses/use-expenses-with-category-live';
import { useCategorySpendingLive } from '@/hooks/expenses/use-category-spending-live';
import { toCurrency } from '@/lib/currency.utils';
import { FC, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import cn from '@/utils/cn';

type ExpensesProps = object;

function parseMonthParam(param: string | null): Date {
  if (param) {
    const parsed = dayjs(param, 'YYYY-MM', true);
    if (parsed.isValid()) return parsed.toDate();
  }
  return new Date();
}

const Expenses: FC<ExpensesProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactionDate, setTransactionDateState] = useState<Date>(() =>
    parseMonthParam(searchParams.get('month'))
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const setTransactionDate = useCallback(
    (date: Date) => {
      setTransactionDateState(date);
      setSearchParams(
        { month: dayjs(date).format('YYYY-MM') },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const expenses = useExpensesWithCategoryLive(transactionDate);
  const categorySpending = useCategorySpendingLive(transactionDate);
  const maxSpending = categorySpending[0]?.total ?? 0;

  const filteredExpenses = useMemo(() => {
    if (!selectedCategoryId) return expenses;
    return expenses?.filter((e) => e.category_id === selectedCategoryId);
  }, [expenses, selectedCategoryId]);

  return (
    <div className='pb-44'>
      <section id='expenses-header'>
        <AppPageHeader title={'Xpense'} description={'Expenses'} />
      </section>

      {/* Spending chart — also acts as category filter */}
      {categorySpending.length > 0 && (
        <div className='my-4'>
          <div className='flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4'>
            {categorySpending.map((item) => {
              const isSelected = selectedCategoryId === item.categoryId;
              return (
                <button
                  key={item.categoryId ?? '__uncategorized__'}
                  onClick={() =>
                    setSelectedCategoryId(isSelected ? null : item.categoryId)
                  }
                  className={`flex-shrink-0 w-32 rounded-xl p-3 text-left transition-colors ${
                    isSelected ? 'bg-neutral-900' : 'bg-neutral-50'
                  }`}
                >
                  <AppTypography
                    variant='small'
                    className={`truncate block mb-1 ${isSelected ? 'text-neutral-200' : 'text-neutral-500'}`}
                  >
                    {item.categoryName}
                  </AppTypography>
                  <AppTypography
                    variant='body'
                    className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-neutral-900'}`}
                  >
                    {toCurrency(item.total)}
                  </AppTypography>
                  <div className='mt-2 h-1.5 rounded-full bg-neutral-200 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-orange-400'
                      style={{
                        width: `${maxSpending > 0 ? (item.total / maxSpending) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <AppTypography
                    variant='small'
                    className={cn('mt-1', {
                      'text-neutral-200': isSelected,
                      'text-neutral-400': !isSelected,
                    })}
                  >
                    {item.percentage.toFixed(0)}%
                  </AppTypography>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense list */}
      <div className='flex flex-col gap-2 mt-4'>
        {filteredExpenses === undefined && (
          <AppDelayLoader>
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                Loading...
              </AppTypography>
            </div>
          </AppDelayLoader>
        )}

        {filteredExpenses !== undefined && filteredExpenses.length === 0 && (
          <div className='text-center py-8'>
            <AppTypography variant='body2' className='text-neutral-500'>
              No expenses this month
            </AppTypography>
          </div>
        )}

        {filteredExpenses?.map((expense) => (
          <ExpenseItem key={expense.id} expense={expense} showDate />
        ))}
      </div>

      <FilterExpenses
        onChangeTransactionDate={setTransactionDate}
        transactionDate={transactionDate}
      />
    </div>
  );
};

export default Expenses;
