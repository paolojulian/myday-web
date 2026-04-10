import { PTypography } from '@paolojulian.dev/design-system';
import AppTypography from '@/components/atoms/app-typography';
import CardNoBudget from '@/components/molecules/card-no-budget';
import { BudgetAnalysis, getBudgetStatusColor } from '@/lib/budget.utils';
import { toCurrency } from '@/lib/currency.utils';
import { FC } from 'react';

type CardMonthlyBudgetProps = {
  analysis: BudgetAnalysis | null;
  isLoading?: boolean;
  onSetBudget?: () => void;
  onEditBudget?: () => void;
};

const CardMonthlyBudget: FC<CardMonthlyBudgetProps> = ({
  analysis,
  onSetBudget,
  onEditBudget,
}) => {
  if (!analysis) {
    return <CardNoBudget onSetBudget={onSetBudget} />;
  }

  const statusColors = getBudgetStatusColor(analysis.status);

  return (
    <div className={`rounded-2xl border border-dashed p-5 ${statusColors.bg} ${statusColors.border}`}>
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
  );
};

export default CardMonthlyBudget;
