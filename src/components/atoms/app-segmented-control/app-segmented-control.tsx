import { FC } from 'react';
import cn from '@/utils/cn';
import { AppTypography } from '@/components/atoms';

type SegmentOption = {
  label: string;
  value: string;
};

type AppSegmentedControlProps = {
  options: SegmentOption[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
};

const AppSegmentedControl: FC<AppSegmentedControlProps> = ({
  options,
  activeValue,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'overflow-hidden grid rounded-full bg-neutral-100',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 py-2 rounded-full text-center transition-colors',
              isActive ? 'bg-black text-white' : 'text-black'
            )}
          >
            <AppTypography variant={'body2'}>{option.label}</AppTypography>
          </button>
        );
      })}
    </div>
  );
};

export default AppSegmentedControl;
