import { FC } from 'react';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';
import StatusIndicator from '@/components/atoms/status-indicator';
import { BudgetAnalysis, getBudgetStatusEmoji } from '@/lib/budget.utils';

type CardBudgetProjectionProps = {
  analysis: BudgetAnalysis;
  isLoading?: boolean;
};

const CardBudgetProjection: FC<CardBudgetProjectionProps> = ({
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
      return 'Budget already depleted!';
    }

    const daysLeft = Math.floor(analysis.projectedDaysLeft);
    if (daysLeft <= 0) {
      return 'Budget will run out today';
    }
    if (daysLeft < analysis.daysRemaining) {
      return `Budget runs out in ~${daysLeft} days`;
    }
    return `Budget will last the month!`;
  };

  return (
    <DashboardCard status={analysis.status}>
      <div className='flex flex-col'>
        <AppTypography variant='small' className='text-neutral-600 mb-2'>
          Budget Survival
        </AppTypography>

        <div className='mb-2 flex flex-row items-baseline gap-2'>
          <AppTypography as='h3' variant='heading' className='mb-1'>
            {Math.floor(analysis.projectedDaysLeft)} days
          </AppTypography>
          <AppTypography variant='small' className='text-neutral-600'>
            at current rate
          </AppTypography>
        </div>

        <StatusIndicator
          emoji={getBudgetStatusEmoji(analysis.status)}
          message={getMessage()}
          status={analysis.status}
        />
      </div>
    </DashboardCard>
  );
};

export default CardBudgetProjection;
