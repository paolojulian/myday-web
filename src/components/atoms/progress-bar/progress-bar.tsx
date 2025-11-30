import { FC } from 'react';
import cn from '@/utils/cn';

type ProgressBarProps = {
  percentage: number; // 0-100
  status?: 'healthy' | 'warning' | 'danger';
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
};

const ProgressBar: FC<ProgressBarProps> = ({
  percentage,
  status = 'healthy',
  showLabel = true,
  height = 'md',
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const statusColors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className='w-full'>
      <div
        className={cn(
          'w-full bg-neutral-200 rounded-full overflow-hidden',
          heights[height]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            statusColors[status]
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <p className='text-xs text-neutral-600 mt-1 text-right'>
          {clampedPercentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
