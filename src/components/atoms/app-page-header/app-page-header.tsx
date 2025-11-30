import AppTypography from '@/components/atoms/app-typography';

type Props = {
  title: string;
  description: string;
};

export const AppPageHeader = ({ title, description }: Props) => {
  return (
    <div className='flex flex-row justify-between items-center'>
      <div className='flex flex-col items-start'>
        <AppTypography variant='body'>{title}</AppTypography>
        <p>{description}</p>
      </div>

      <button aria-label='Open settings button'>S</button>
    </div>
  );
};
