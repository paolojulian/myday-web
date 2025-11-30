import { FC, ReactNode } from 'react';
import cn from '@/utils/cn';

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'tall' | 'wide';
  status?: 'healthy' | 'warning' | 'danger' | 'neutral';
};

const DashboardCard: FC<DashboardCardProps> = ({
  children,
  className,
  variant = 'default',
  status = 'neutral',
}) => {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    neutral: 'bg-white border-neutral-200',
  };

  const variantClasses = {
    default: '',
    tall: 'row-span-2',
    wide: 'col-span-2',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all',
        statusColors[status],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export default DashboardCard;
