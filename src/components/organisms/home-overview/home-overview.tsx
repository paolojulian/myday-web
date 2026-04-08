import { PTypography } from '@paolojulian.dev/design-system';
import AppDelayLoader from '@/components/atoms/app-delay-loader';
import AppTypography from '@/components/atoms/app-typography';
import CardNoBudget from '@/components/molecules/card-no-budget';
import CardSpentToday from '@/components/molecules/card-spent-today';
import ExpenseItem from '@/components/molecules/expense-item';
import { useBudgetAnalysis } from '@/hooks/budget/use-budget-analysis';
import { useExpensesByDayLive } from '@/hooks/expenses/use-expenses-by-day-live';
import { useRecentTransactionsBeforeDateLive } from '@/hooks/expenses/use-recent-transactions-before-date-live';
import { useSpentTodayLive } from '@/hooks/expenses/use-spent-today-live';
import { getBudgetStatusColor } from '@/lib/budget.utils';
import { toCurrency } from '@/lib/currency.utils';
import {
  getHumanReadableDate,
  getNextDay,
  getPreviousDay,
  isToday,
  isYesterday,
} from '@/lib/dates.utils';
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

  const currentMonth = useMemo(() => new Date(), []);
  const budgetAnalysisQuery = useBudgetAnalysis(currentMonth);

  const isTodaySelected = isToday(selectedDate);
  const isYesterdaySelected = isYesterday(selectedDate);
  const dateLabel = isTodaySelected ? 'Today' : isYesterdaySelected ? 'Yesterday' : getHumanReadableDate(selectedDate);

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
          <AppTypography variant='small' className='text-neutral-400'>Loading...</AppTypography>
        </div>
      </AppDelayLoader>
    );
  }

  const analysis = budgetAnalysisQuery.data;
  const statusColors = analysis ? getBudgetStatusColor(analysis.status) : null;

  return (
    <div className='py-4'>

      {/* ── Budget card ── */}
      {hasBudget && analysis && statusColors ? (
        <div className={`rounded-2xl border border-dashed p-5 mb-6 ${statusColors.bg} ${statusColors.border}`}>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <PTypography variant='body-wide' className='text-neutral-500 uppercase mb-1'>
                Monthly Budget
              </PTypography>
              <PTypography variant='heading' className='text-neutral-900'>
                {toCurrency(analysis.remainingBudget)}
              </PTypography>
              <AppTypography variant='small' className='text-neutral-400 mt-0.5'>
                of {toCurrency(analysis.monthlyBudget)} remaining
              </AppTypography>
            </div>

            {onEditBudget && (
              <button
                onClick={onEditBudget}
                className='p-1.5 rounded-full hover:bg-black/10 active:scale-95 transition-all'
                aria-label='Edit budget'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                  <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                </svg>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className='h-1.5 rounded-full bg-black/10 overflow-hidden mb-4'>
            <div
              className={`h-full rounded-full transition-all ${statusColors.progress}`}
              style={{ width: `${analysis.percentageUsed}%` }}
            />
          </div>

          {/* Secondary metrics */}
          <div className='grid grid-cols-3 gap-2'>
            <div>
              <AppTypography variant='small' className='text-neutral-400 mb-0.5'>Spent</AppTypography>
              <AppTypography variant='body' className='font-semibold text-neutral-800 text-sm'>
                {toCurrency(analysis.totalSpent)}
              </AppTypography>
            </div>
            <div>
              <AppTypography variant='small' className='text-neutral-400 mb-0.5'>Daily left</AppTypography>
              <AppTypography variant='body' className={`font-semibold text-sm ${statusColors.text}`}>
                {toCurrency(Math.max(0, analysis.remainingDailyBudget))}
              </AppTypography>
            </div>
            <div>
              <AppTypography variant='small' className='text-neutral-400 mb-0.5'>Days left</AppTypography>
              <AppTypography variant='body' className='font-semibold text-neutral-800 text-sm'>
                {analysis.daysRemaining}d
              </AppTypography>
            </div>
          </div>
        </div>
      ) : (
        <div className='mb-6'>
          <CardNoBudget onSetBudget={onSetBudget} />
        </div>
      )}

      {/* ── Day navigation ── */}

      {/* ── Spent today ── */}
      <CardSpentToday amount={spentToday} date={selectedDate} isLoading={false} />

      {/* ── Day expenses ── */}
      <div className='mt-6'>
        <PTypography variant='body-wide' className='text-neutral-400 uppercase mb-3'>
          {isTodaySelected ? "Today's Expenses" : isYesterdaySelected ? "Yesterday's Expenses" : `Expenses on ${dateLabel}`}
        </PTypography>

        <div className='flex flex-col gap-2'>
          {dayExpenses === undefined && (
            <AppDelayLoader>
              <div className='text-center py-8'>
                <AppTypography variant='small' className='text-neutral-400'>Loading...</AppTypography>
              </div>
            </AppDelayLoader>
          )}
          {dayExpenses !== undefined && dayExpenses.length === 0 && (
            <div className='text-center py-8'>
              <AppTypography variant='small' className='text-neutral-400'>No expenses for this day</AppTypography>
            </div>
          )}
          {dayExpenses?.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} />
          ))}
          <div ref={daySentinelRef} className='h-1' />
        </div>
      </div>

      {/* ── Recent expenses ── */}
      <div className='mt-8'>
        <PTypography variant='body-wide' className='text-neutral-400 uppercase mb-3'>
          Recent
        </PTypography>

        <div className='flex flex-col gap-2'>
          {recentExpenses === undefined && (
            <AppDelayLoader>
              <div className='text-center py-8'>
                <AppTypography variant='small' className='text-neutral-400'>Loading...</AppTypography>
              </div>
            </AppDelayLoader>
          )}
          {recentExpenses !== undefined && recentExpenses.length === 0 && (
            <div className='text-center py-8'>
              <AppTypography variant='small' className='text-neutral-400'>No recent expenses</AppTypography>
            </div>
          )}
          {recentExpenses?.map((expense) => (
            <ExpenseItem key={expense.id} expense={expense} showDate />
          ))}
          <div ref={recentSentinelRef} className='h-1' />
        </div>
      </div>
      {/* ── Day navigation pill ── */}
      <div
        className='fixed left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-neutral-900 text-white rounded-full px-2 py-1.5 shadow-xl shadow-neutral-900/30'
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
      >
        <button
          onClick={() => { navigator.vibrate?.(8); handlePrevDay(); }}
          className='p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all'
          aria-label='Previous day'
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </button>

        <span className='text-sm font-semibold px-2 whitespace-nowrap w-28 text-center'>
          {dateLabel}
        </span>

        <button
          onClick={() => { if (!isTodaySelected) { navigator.vibrate?.(8); handleNextDay(); } }}
          disabled={isTodaySelected}
          className='p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed'
          aria-label='Next day'
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='9 18 15 12 9 6' />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HomeOverview;
