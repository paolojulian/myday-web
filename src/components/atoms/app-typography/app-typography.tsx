import { cva, type VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes } from 'react';
import cn from '@/utils/cn';

const typographyVariants = cva('', {
  variants: {
    variant: {
      heading: 'text-2xl font-bold leading-tight',
      body: 'text-base font-normal leading-normal',
      body2: 'text-sm font-semibold leading-relaxed',
      small: 'text-xs font-normal leading-snug',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type AppTypographyProps = {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
} & VariantProps<typeof typographyVariants> &
  HTMLAttributes<HTMLElement>;

const AppTypography: FC<AppTypographyProps> = ({
  as: Component = 'p',
  variant,
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default AppTypography;
