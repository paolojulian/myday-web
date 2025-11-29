import AppTypography from '@/components/atoms/app-typography';
import cn from '@/utils/cn';
import { FC, TextareaHTMLAttributes, useEffect, useState } from 'react';

type AppTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  onChangeText?: (text?: string) => void;
  id: string;
  label: string;
  value?: string;
  isFullWidth?: boolean;
  errorMessage?: string;
};

const AppTextArea: FC<AppTextAreaProps> = ({
  onChangeText = () => {},
  onChange,
  id,
  label,
  className,
  isFullWidth = true,
  errorMessage,
  value,
  ...props
}) => {
  const [localValue, setLocalValue] = useState<string | undefined>(value);

  const hasValue: boolean = !!value;
  const hasError: boolean = !!errorMessage;

  useEffect(() => {
    // Sync local value with the parent
    if (localValue !== value) {
      onChangeText(localValue);
    }
  }, [localValue]);

  const handleChange: TextareaHTMLAttributes<HTMLTextAreaElement>['onChange'] =
    (e) => {
      onChange?.(e);
      setLocalValue(e.target?.value);
    };

  return (
    <div
      data-element-name='AppTextArea'
      className={cn('relative', 'group', {
        'w-full': isFullWidth,
      })}
    >
      <textarea
        onChange={handleChange}
        id={id}
        className={cn(
          'peer',
          'pt-6 px-4 pb-2 bg-neutral-100 rounded dark:border-neutral-700',
          'text-base font-normal leading-normal',
          'resize-y min-h-[100px]',
          {
            'w-full': isFullWidth,
            'border-red-500 outline outline-red-500': !!hasError,
          },
          className
        )}
        value={value}
        {...props}
      />

      {/* Label - always visible at top */}
      <label
        aria-label={id}
        htmlFor={id}
        className={cn(
          'absolute left-4 top-1',
          'pointer-events-none text-neutral-500'
        )}
      >
        <AppTypography
          as='span'
          variant='small'
          className='font-bold'
        >
          {label}
        </AppTypography>
      </label>

      {/* Error message below textarea */}
      {hasError && (
        <div className='mt-1 px-1'>
          <AppTypography variant='small' className='text-red-500'>
            {errorMessage}
          </AppTypography>
        </div>
      )}
    </div>
  );
};

export default AppTextArea;
