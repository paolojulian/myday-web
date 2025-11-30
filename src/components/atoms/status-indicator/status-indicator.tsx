import { FC } from 'react';
import AppTypography from '../app-typography';

type StatusIndicatorProps = {
  emoji: string;
  message: string;
  status: 'healthy' | 'warning' | 'danger';
};

const StatusIndicator: FC<StatusIndicatorProps> = ({
  emoji,
  message,
  status,
}) => {
  const textColors = {
    healthy: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
  };

  return (
    <div className='flex items-center gap-2 mt-2'>
      <span className='text-2xl'>{emoji}</span>
      <AppTypography variant='small' className={textColors[status]}>
        {message}
      </AppTypography>
    </div>
  );
};

export default StatusIndicator;
