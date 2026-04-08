import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, FC } from 'react';
import cn from '@/utils/cn';

const buttonVariants = cva(
  'flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        solid: 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 hover:bg-neutral-800',
        outlined: 'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50',
        ghost: 'text-neutral-500 hover:text-neutral-900',
        danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
        primary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-xl gap-1.5',
        md: 'h-11 px-5 text-sm rounded-2xl gap-2',
        lg: 'h-14 px-6 text-base rounded-2xl gap-2',
        icon: 'w-14 h-14 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  }
);

type AppButtonProps = {
  hasHapticFeedback?: boolean;
} & VariantProps<typeof buttonVariants> &
  ButtonHTMLAttributes<HTMLButtonElement>;

const AppButton: FC<AppButtonProps> = ({
  hasHapticFeedback = false,
  variant,
  size,
  className,
  onClick,
  children,
  ...props
}) => {
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (e) => {
    if (hasHapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppButton;
