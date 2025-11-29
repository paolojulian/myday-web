import AppTypography from '@/components/atoms/app-typography';
import cn from '@/utils/cn';
import { forwardRef, InputHTMLAttributes, useEffect, useState } from 'react';

type AppTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  onChangeText?: (text?: string | number) => void;
  id: string;
  label: string;
  value?: string | number;
  isFullWidth?: boolean;
  errorMessage?: string;
  formatter?: (value: string) => string;
};

const AppTextInput = forwardRef<HTMLInputElement, AppTextInputProps>(
  (
    {
      onChangeText = () => {},
      onChange,
      id,
      label,
      className,
      isFullWidth = true,
      errorMessage,
      value,
      formatter,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState<string | number | undefined>(
      value
    );

    const hasValue: boolean = !!value;
    const hasError: boolean = !!errorMessage;

    useEffect(() => {
      // Sync local value with the parent
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, [localValue]);

    const handleChange: InputHTMLAttributes<HTMLInputElement>['onChange'] = (
      e
    ) => {
      const inputValue = e.target?.value;
      const formattedValue = formatter ? formatter(inputValue) : inputValue;

      // Update the event target value with formatted value before calling onChange
      if (formatter) {
        e.target.value = formattedValue;
      }

      onChange?.(e);
      setLocalValue(formattedValue);
    };

    return (
      <div>
        <div
          data-element-name='AppTextInput'
          className={cn('relative', 'group', {
            'w-full': isFullWidth,
          })}
        >
          <input
            ref={ref}
            onChange={handleChange}
            id={id}
            className={cn(
              'peer',
              'placeholder-transparent focus:placeholder-neutral-500',
              'pt-6 px-4 pb-2 bg-neutral-100 rounded dark:border-neutral-700',
              'text-base font-normal leading-normal',
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
              {label}
            </AppTypography>
          </div>

          {/* Placeholder label */}
          <label
            aria-label={id}
            htmlFor={id}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2',
              'text-neutral-500',
              'pointer-events-none transition-all ease-in-out',
              'peer-placeholder-shown:opacity-100',
              'peer-placeholder-shown:scale-100',
              'peer-focus:opacity-0',
              'peer-focus:scale-0',
              {
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
              {label}
            </AppTypography>
          </label>
        </div>
        {/* Error message below input */}
        {hasError && (
          <div className='mt-1 px-1'>
            <AppTypography variant='small' className='text-red-500'>
              {errorMessage}
            </AppTypography>
          </div>
        )}
      </div>
    );
  }
);

AppTextInput.displayName = 'AppTextInput';

export default AppTextInput;
