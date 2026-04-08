import { FC } from 'react';
import { toCurrency } from '@/lib/currency.utils';
import {
  isToday,
  isYesterday,
  getHumanReadableDate,
} from '@/lib/dates.utils';
import AppTypography from '@/components/atoms/app-typography';

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
    <div className='flex items-center gap-4 py-5'>
      <div className='flex-1 h-px bg-neutral-200' />
      <div className='text-center'>
        <AppTypography variant='small' className='text-neutral-400 uppercase tracking-widest text-xs mb-1'>
          {getSpentLabel(date)}
        </AppTypography>
        {isLoading ? (
          <AppTypography variant='heading' className='text-neutral-300'>
            —
          </AppTypography>
        ) : (
          <AppTypography as='h2' variant='heading' className='text-neutral-900 text-3xl font-bold'>
            {toCurrency(amount)}
          </AppTypography>
        )}
      </div>
      <div className='flex-1 h-px bg-neutral-200' />
    </div>
  );
};

export default CardSpentToday;
