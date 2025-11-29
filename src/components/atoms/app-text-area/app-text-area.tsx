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

  const hasValue: boolean = !!localValue;
  const hasError: boolean = !!errorMessage;
  const resolvedLabel: string = hasError && errorMessage ? errorMessage : label;

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
          'placeholder-transparent focus:placeholder-neutral-500',
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

      {/* Focused label */}
      <div
        className={cn(
          'absolute left-4 top-1',
          'text-neutral-500',
          'pointer-events-none transition-all ease-in-out',
          'peer-placeholder-shown:opacity-0',
          'peer-placeholder-shown:scale-0',
          'peer-focus:opacity-100',
          'peer-focus:scale-100',
          {
            'text-red-500': hasError,
            'opacity-0 scale-0': !hasValue,
            'opacity-100 scale-100': !!hasValue,
          }
        )}
      >
        <AppTypography
          as='span'
          variant='small'
          className='text-black font-bold'
        >
          {resolvedLabel}
        </AppTypography>
      </div>

      {/* Placeholder label */}
      <label
        aria-label={id}
        htmlFor={id}
        className={cn(
          'absolute left-4 top-6',
          'text-neutral-500',
          'pointer-events-none transition-all ease-in-out',
          'peer-placeholder-shown:opacity-100',
          'peer-placeholder-shown:scale-100',
          'peer-focus:opacity-0',
          'peer-focus:scale-0',
          {
            'text-red-500': hasError,
            'opacity-0 scale-0': hasValue,
            'opacity-100 scale-100': !hasValue,
          }
        )}
      >
        <AppTypography
          as='p'
          variant='body2'
          className='text-neutral-500 font-semibold'
        >
          {resolvedLabel}
        </AppTypography>
      </label>
    </div>
  );
};

export default AppTextArea;
