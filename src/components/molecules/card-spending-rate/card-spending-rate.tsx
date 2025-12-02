import { FC } from 'react';
import { toCurrency } from '@/lib/currency.utils';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';
import StatusIndicator from '@/components/atoms/status-indicator';
import { BudgetAnalysis, getBudgetStatusEmoji } from '@/lib/budget.utils';

type CardSpendingRateProps = {
  analysis: BudgetAnalysis;
  isLoading?: boolean;
};

const CardSpendingRate: FC<CardSpendingRateProps> = ({
  analysis,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <DashboardCard status='neutral'>
        <AppTypography variant='small'>Loading...</AppTypography>
      </DashboardCard>
    );
  }

  const getMessage = () => {
    if (analysis.isOverBudget) {
      return 'Budget exceeded!';
    }
    if (analysis.isOnTrack) {
      return "You're on track!";
    }
    return 'Spending above target';
  };

  const difference = analysis.actualDailyRate - analysis.budgetedDailyRate;
  const diffText =
    difference > 0
      ? `${toCurrency(Math.abs(difference))} over`
      : `${toCurrency(Math.abs(difference))} under`;

  return (
    <DashboardCard status={analysis.status}>
      <AppTypography variant='small' className='text-neutral-600 mb-3'>
        Daily Spending Rate
      </AppTypography>

      <div className='space-y-2 mb-3'>
        <div className='flex justify-between items-center'>
          <AppTypography variant='small' className='text-neutral-600'>
            Target:
          </AppTypography>
          <AppTypography variant='body2' className='font-bold'>
            {toCurrency(analysis.budgetedDailyRate)}
          </AppTypography>
        </div>

        <div className='flex justify-between items-center'>
          <AppTypography variant='small' className='text-neutral-600'>
            Actual:
          </AppTypography>
          <AppTypography variant='body2' className='font-bold'>
            {toCurrency(analysis.actualDailyRate)}
          </AppTypography>
        </div>

        <div className='flex justify-between gap-2 pt-2 border-t border-neutral-200'>
          <AppTypography variant='small' className='text-neutral-600'>
            Difference:
          </AppTypography>
          <AppTypography
            variant='small'
            className={
              difference > 0
                ? 'text-red-600 font-semibold'
                : 'text-green-600 font-semibold'
            }
          >
            {diffText}
          </AppTypography>
        </div>
      </div>

      <StatusIndicator
        emoji={getBudgetStatusEmoji(analysis.status)}
        message={getMessage()}
        status={analysis.status}
      />
    </DashboardCard>
  );
};

export default CardSpendingRate;
