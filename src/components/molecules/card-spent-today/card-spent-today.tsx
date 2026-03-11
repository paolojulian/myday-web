import { FC } from 'react';
import { toCurrency } from '@/lib/currency.utils';
import {
  getHumanReadableDate,
  isToday,
  isYesterday,
} from '@/lib/dates.utils';
import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '../dashboard-card';

type CardSpentTodayProps = {
  amount: number;
  date?: Date;
  isLoading?: boolean;
};

function getSpentLabel(date?: Date): string {
  if (!date || isToday(date)) return 'Spent Today';
  if (isYesterday(date)) return 'Spent Yesterday';
  return `Spent on ${getHumanReadableDate(date)}`;
}

const CardSpentToday: FC<CardSpentTodayProps> = ({ amount, date, isLoading }) => {
  return (
    <DashboardCard status='neutral'>
      <div className='text-center'>
        <AppTypography variant='small' className='text-neutral-600 mb-2'>
          {getSpentLabel(date)}
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
