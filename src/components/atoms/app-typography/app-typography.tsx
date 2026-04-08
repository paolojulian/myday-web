import { PTypography } from '@paolojulian.dev/design-system';
import { FC, HTMLAttributes } from 'react';
import cn from '@/utils/cn';

type Variant = 'heading' | 'body' | 'body2' | 'small';

type AppTypographyProps = {
  as?: React.ElementType;
  variant?: Variant;
} & HTMLAttributes<HTMLElement>;

const variantMap: Record<Variant, { dsVariant: 'heading' | 'body' | 'body-wide' | 'heading-lg' | 'heading-xl' | 'serif'; className?: string }> = {
  heading: { dsVariant: 'heading' },
  body: { dsVariant: 'body' },
  body2: { dsVariant: 'body' },
  small: { dsVariant: 'body', className: 'text-xs' },
};

const AppTypography: FC<AppTypographyProps> = ({
  as,
  variant = 'body',
  className,
  children,
  ...props
}) => {
  const { dsVariant, className: variantClass } = variantMap[variant];

  return (
    <PTypography
      as={as}
      variant={dsVariant}
      className={cn(variantClass, className)}
      {...props}
    >
      {children}
    </PTypography>
  );
};

export default AppTypography;
