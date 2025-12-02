import { FC } from 'react';
import { toCurrency } from '@/lib/currency.utils';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';
import ProgressBar from '@/components/atoms/progress-bar';
import { BudgetAnalysis } from '@/lib/budget.utils';

type CardRemainingBudgetProps = {
  analysis: BudgetAnalysis;
  isLoading?: boolean;
};

const CardRemainingBudget: FC<CardRemainingBudgetProps> = ({
  analysis,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <DashboardCard status='neutral'>
        <AppTypography variant='small' className='text-neutral-600'>
          Loading...
        </AppTypography>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard status={analysis.status}>
      <div className='flex flex-col'>
        <AppTypography variant='small' className='text-neutral-600 mb-2'>
          Remaining Budget
        </AppTypography>

        <AppTypography as='h2' className='font-bold mb-3' variant='heading'>
          {toCurrency(analysis.remainingBudget)}
        </AppTypography>

        <div className='mb-3'>
          <ProgressBar
            percentage={analysis.percentageUsed}
            status={analysis.status}
            height='sm'
          />
        </div>

        <AppTypography variant='small' className='text-neutral-600'>
          {toCurrency(analysis.totalSpent)} of{' '}
          {toCurrency(analysis.monthlyBudget)} used
        </AppTypography>
      </div>
    </DashboardCard>
  );
};

export default CardRemainingBudget;
