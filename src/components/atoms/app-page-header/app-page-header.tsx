import AppTypography from '@/components/atoms/app-typography';
import dayjs from 'dayjs';

type Props = {
  title: string;
  description: string;
};

export const AppPageHeader = ({ title, description }: Props) => {
  const today = dayjs();

  return (
    <div className='flex flex-row justify-between items-center py-2'>
      <div className='flex flex-col items-start'>
        <AppTypography variant='body'>{title}</AppTypography>
        {description && <AppTypography variant='small' className='text-neutral-400'>{description}</AppTypography>}
      </div>

      <div className='text-right'>
        <AppTypography variant='body' className='font-semibold text-neutral-800'>
          {today.format('MMM D')}
        </AppTypography>
        <AppTypography variant='small' className='text-neutral-400'>
          {today.format('ddd')}
        </AppTypography>
      </div>
    </div>
  );
};
