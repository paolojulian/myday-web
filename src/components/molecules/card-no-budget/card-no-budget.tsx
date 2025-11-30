import { FC } from 'react';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';

type CardNoBudgetProps = {
  onSetBudget?: () => void;
};

const CardNoBudget: FC<CardNoBudgetProps> = ({ onSetBudget }) => {
  return (
    <DashboardCard variant='wide' status='neutral'>
      <div className='text-center py-6'>
        <span className='text-5xl mb-4 block'>💰</span>
        <AppTypography variant='heading' className='mb-2'>
          No Monthly Budget Set
        </AppTypography>
        <AppTypography variant='body' className='text-neutral-600 mb-4'>
          Set a monthly budget to track your spending and get insights
        </AppTypography>
        {onSetBudget && (
          <button
            onClick={onSetBudget}
            className='px-6 py-3 bg-orange-400 text-white rounded-full hover:bg-orange-500 active:scale-95 transition-all font-semibold'
          >
            Set Budget Now
          </button>
        )}
      </div>
    </DashboardCard>
  );
};

export default CardNoBudget;
