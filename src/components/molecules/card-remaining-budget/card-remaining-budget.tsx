import AppTypography from '@/components/atoms/app-typography';
import { BudgetAnalysis } from '@/lib/budget.utils';
import { toCurrency } from '@/lib/currency.utils';
import { FC } from 'react';
import DashboardCard from '../dashboard-card';

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
          Daily Budget
        </AppTypography>

        <AppTypography as='h2' className='font-bold mb-3' variant='heading'>
          {toCurrency(analysis.remainingDailyBudget)}
        </AppTypography>
      </div>
    </DashboardCard>
  );
};

export default CardRemainingBudget;
