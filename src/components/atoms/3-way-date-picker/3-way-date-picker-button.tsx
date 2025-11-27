import cn from '@/utils/cn';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

function ThreeWayDatePickerButton({
  className = '',
  children,
  isActive = false,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'group',
        'relative',
        {
          'text-black dark:text-white': isActive,
          'text-neutral-600 dark:text-neutral-400': !isActive,
        },
        className
      )}
      type='button'
      {...props}
    >
      <div
        className={cn(
          'absolute inset-0 group-active:scale-90 group-active:outline-1 transition-all -z-10',
          'bg-neutral-50 dark:bg-neutral-800',
          'outline-neutral-800 dark:outline-neutral-50',
          {
            'outline-1': isActive,
          }
        )}
      ></div>
      <div className='flex flex-col items-center gap-2 p-2 py-4 z-10'>
        {children}
      </div>
    </button>
  );
}

export default ThreeWayDatePickerButton;
