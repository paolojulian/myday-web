import { FC } from 'react';
import { PTypography } from '@paolojulian.dev/design-system';
import AppTypography from '@/components/atoms/app-typography';

type CardNoBudgetProps = {
  onSetBudget?: () => void;
};

const CardNoBudget: FC<CardNoBudgetProps> = ({ onSetBudget }) => {
  return (
    <div className='rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6'>
      <div className='flex items-center gap-4'>
        {/* Flat icon */}
        <div className='flex-shrink-0 w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='22'
            height='22'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-neutral-400'
          >
            <rect x='2' y='5' width='20' height='14' rx='3' />
            <path d='M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z' fill='currentColor' stroke='none' />
            <path d='M2 9h20' />
          </svg>
        </div>

        <div className='flex-1 min-w-0'>
          <PTypography variant='body-wide' className='text-neutral-900 uppercase mb-0.5'>
            No budget set
          </PTypography>
          <AppTypography variant='small' className='text-neutral-400'>
            Set a monthly limit to track your spending
          </AppTypography>
        </div>

        {onSetBudget && (
          <button
            onClick={onSetBudget}
            className='flex-shrink-0 h-9 px-4 bg-neutral-900 text-white text-sm font-medium rounded-xl active:scale-95 transition-all'
          >
            Set
          </button>
        )}
      </div>
    </div>
  );
};

export default CardNoBudget;
