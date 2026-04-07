import AppDelayLoader from '@/components/atoms/app-delay-loader';
import AppTypography from '@/components/atoms/app-typography';
import CardNoBudget from '@/components/molecules/card-no-budget';
import CardRemainingBudget from '@/components/molecules/card-remaining-budget';
import CardSpentToday from '@/components/molecules/card-spent-today';
import DashboardCard from '@/components/molecules/dashboard-card';
import { useBudgetAnalysis } from '@/hooks/budget/use-budget-analysis';
import { useExpensesByDayLive } from '@/hooks/expenses/use-expenses-by-day-live';
import { useRecentTransactionsBeforeDateLive } from '@/hooks/expenses/use-recent-transactions-before-date-live';
import { useSpentTodayLive } from '@/hooks/expenses/use-spent-today-live';
import ExpenseItem from '@/components/molecules/expense-item';
import {
  getHumanReadableDate,
  getNextDay,
  getPreviousDay,
  isToday,
} from '@/lib/dates.utils';
import { toCurrency } from '@/lib/currency.utils';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type HomeOverviewProps = {
  date?: Date;
  onSetBudget?: () => void;
  onEditBudget?: () => void;
};

const HomeOverview: FC<HomeOverviewProps> = ({
  date: initialDate = new Date(),
  onSetBudget,
  onEditBudget,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dayLimit, setDayLimit] = useState(10);
  const [recentLimit, setRecentLimit] = useState(10);
  const daySentinelRef = useRef<HTMLDivElement>(null);
  const recentSentinelRef = useRef<HTMLDivElement>(null);

  // Always use current month — not affected by day navigation
  const currentMonth = useMemo(() => new Date(), []);
  const budgetAnalysisQuery = useBudgetAnalysis(currentMonth);

  const isTodaySelected = isToday(selectedDate);
  const dateLabel = isTodaySelected
    ? 'Today'
    : getHumanReadableDate(selectedDate);

  const spentToday = useSpentTodayLive(selectedDate);
  const dayExpenses = useExpensesByDayLive(selectedDate, dayLimit);
  const recentExpenses = useRecentTransactionsBeforeDateLive(selectedDate, recentLimit);

  const hasBudget = budgetAnalysisQuery.data !== null;
  const isLoading = budgetAnalysisQuery.isLoading;

  const handlePrevDay = useCallback(() => {
    setSelectedDate((d) => getPreviousDay(d));
    setDayLimit(10);
    setRecentLimit(10);
  }, []);

  const handleNextDay = useCallback(() => {
    if (!isTodaySelected) {
      setSelectedDate((d) => getNextDay(d));
      setDayLimit(10);
      setRecentLimit(10);
    }
  }, [isTodaySelected]);

  // Infinite scroll for day expenses
  useEffect(() => {
    const sentinel = daySentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && dayExpenses && dayExpenses.length === dayLimit) {
          setDayLimit((l) => l + 10);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [dayExpenses, dayLimit]);

  // Infinite scroll for recent expenses
  useEffect(() => {
    const sentinel = recentSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && recentExpenses && recentExpenses.length === recentLimit) {
          setRecentLimit((l) => l + 10);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [recentExpenses, recentLimit]);

  if (isLoading) {
    return (
      <AppDelayLoader>
        <div className='py-4 text-center'>
          <p className='text-neutral-500'>Loading dashboard...</p>
        </div>
      </AppDelayLoader>
    );
  }

  return (
    <div className='py-4'>
      {/* Budget summary — always current month, above date selector */}
      {hasBudget && budgetAnalysisQuery.data ? (
        <div className='grid grid-cols-2 gap-2 mb-4'>
          <CardRemainingBudget
            analysis={budgetAnalysisQuery.data}
            isLoading={budgetAnalysisQuery.isLoading}
          />
          <DashboardCard status={budgetAnalysisQuery.data.status}>
            <div className='flex flex-col relative'>
              {onEditBudget && (
                <button
                  onClick={onEditBudget}
                  className='absolute top-0 right-0 p-1 rounded-full hover:bg-black/10 active:scale-95 transition-all'
                  aria-label='Edit budget'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                    <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                  </svg>
                </button>
              )}
              <AppTypography variant='small' className='text-neutral-600 mb-2'>
                Remaining
              </AppTypography>
              <AppTypography as='h2' variant='heading' className='font-bold'>
                {toCurrency(budgetAnalysisQuery.data.remainingBudget)}
              </AppTypography>
              <AppTypography variant='small' className='text-neutral-500 mt-1'>
                of {toCurrency(budgetAnalysisQuery.data.monthlyBudget)}
              </AppTypography>
            </div>
          </DashboardCard>
        </div>
      ) : (
        <div className='mb-4'>
          <CardNoBudget onSetBudget={onSetBudget} />
        </div>
      )}

      {/* Day navigation */}
      <div className='flex items-center justify-between mb-3'>
        <button
          onClick={handlePrevDay}
          className='p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors'
          aria-label='Previous day'
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='15 18 9 12 15 6' /></svg>
        </button>

        <AppTypography variant='body' className='font-semibold text-neutral-700'>
          {dateLabel}
        </AppTypography>

        <button
          onClick={handleNextDay}
          disabled={isTodaySelected}
          className='p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
          aria-label='Next day'
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='9 18 15 12 9 6' /></svg>
        </button>
      </div>

      {/* Spent on selected day */}
      <CardSpentToday amount={spentToday} date={selectedDate} isLoading={false} />

      {/* Day's expense list */}
      <div className='mt-6'>
        <AppTypography variant='heading' className='mb-3'>
          {isTodaySelected ? "Today's Expenses" : `Expenses on ${dateLabel}`}
        </AppTypography>

        <div className='flex flex-col gap-2'>
          {dayExpenses === undefined && (
            <AppDelayLoader>
              <div className='text-center py-8'>
                <AppTypography variant='body2' className='text-neutral-500'>
                  Loading...
                </AppTypography>
              </div>
            </AppDelayLoader>
          )}

          {dayExpenses !== undefined && dayExpenses.length === 0 && (
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                No expenses for this day
              </AppTypography>
            </div>
          )}

          {dayExpenses?.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}

          <div ref={daySentinelRef} className='h-1' />
        </div>
      </div>

      {/* Recent past expenses */}
      <div className='mt-6'>
        <AppTypography variant='heading' className='mb-3'>
          Recent Expenses
        </AppTypography>

        <div className='flex flex-col gap-2'>
          {recentExpenses === undefined && (
            <AppDelayLoader>
              <div className='text-center py-8'>
                <AppTypography variant='body2' className='text-neutral-500'>
                  Loading...
                </AppTypography>
              </div>
            </AppDelayLoader>
          )}

          {recentExpenses !== undefined && recentExpenses.length === 0 && (
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                No recent expenses
              </AppTypography>
            </div>
          )}

          {recentExpenses?.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} showDate />
          ))}

          <div ref={recentSentinelRef} className='h-1' />
        </div>
      </div>
    </div>
  );
};

export default HomeOverview;
