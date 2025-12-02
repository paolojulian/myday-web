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
          'text-black': isActive,
          'text-neutral-600': !isActive,
        },
        className
      )}
      type='button'
      {...props}
    >
      <div
        className={cn(
          'absolute inset-0 group-active:scale-90 transition-all -z-10',
          'rounded',
          {
            'bg-orange-100 outline outline-orange-500': isActive,
            'bg-neutral-100': !isActive,
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
