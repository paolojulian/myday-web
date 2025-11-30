import { FC } from 'react';
import { toCurrency } from '@/lib/currency.utils';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';

type CardSpentTodayProps = {
  amount: number;
  isLoading?: boolean;
};

const CardSpentToday: FC<CardSpentTodayProps> = ({ amount, isLoading }) => {
  return (
    <DashboardCard status='neutral'>
      <div className='text-center'>
        <AppTypography variant='small' className='text-neutral-600 mb-2'>
          Spent Today
        </AppTypography>
        {isLoading ? (
          <AppTypography variant='heading' className='text-neutral-400'>
            ...
          </AppTypography>
        ) : (
          <AppTypography as='h2' variant='heading' className='text-neutral-900'>
            {toCurrency(amount)}
          </AppTypography>
        )}
      </div>
    </DashboardCard>
  );
};

export default CardSpentToday;
