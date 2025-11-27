import CaretLeftIcon from '@/components/atoms/icons/CaretLeftIcon';
import cn from 'classnames';
import { FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';

type AppBottomSheetProps = {
  onClose: () => void;
  HeaderComponent?: ReactNode | null;
  HeaderRightComponent?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  title?: string;
  /** percent/number */
  height?: string;
  variant?: 'full' | 'custom';
  zIndex?: number;
};

const AppBottomSheet: FC<AppBottomSheetProps> = ({
  onClose,
  HeaderComponent,
  HeaderRightComponent,
  children,
  title,
  isOpen = false,
  height = '100%',
  variant = 'full',
  zIndex = 1000,
}) => {
  return ReactDOM.createPortal(
    <div
      className={cn('fixed inset-0 flex flex-col justify-end', {
        'pointer-events-none': !isOpen,
        'pointer-events-auto': isOpen,
      })}
      style={{
        zIndex,
      }}
    >
      {/* Backdrop */}
      {variant !== 'full' && (
        <div
          className={cn('absolute inset-0 bg-black/20', 'transition-opacity', {
            'opacity-0': !isOpen,
          })}
          onClick={onClose}
        ></div>
      )}

      {/* App bottom sheet card */}
      <div
        className={cn(
          'bg-white w-full mt-auto',
          'transition-all ease-out duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)]',
          'shadow-2xl',
          {
            'rounded-t-3xl': variant !== 'full',
            'translate-y-full': !isOpen,
            'translate-y-0': isOpen,
          }
        )}
        style={{
          height,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {HeaderComponent === undefined ? (
          HeaderComponent
        ) : (
          <div className='grid grid-cols-[1fr_auto_1fr] p-4 items-center'>
            <button onClick={onClose}>
              <CaretLeftIcon />
            </button>
            <div>{title}</div>
            <div>{HeaderRightComponent}</div>
          </div>
        )}
        <div className='p-4'>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default AppBottomSheet;
