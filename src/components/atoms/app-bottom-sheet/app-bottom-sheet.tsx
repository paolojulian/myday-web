import CaretLeftIcon from '@/components/atoms/icons/CaretLeftIcon';
import cn from 'classnames';
import { FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';

type AppBottomSheetProps = {
  onClose: () => void;
  HeaderComponent?: ReactNode;
  HeaderRightComponent?: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  title?: string;
};

const AppBottomSheet: FC<AppBottomSheetProps> = ({
  onClose,
  HeaderComponent,
  HeaderRightComponent,
  children,
  title,
  isOpen = false,
}) => {
  return ReactDOM.createPortal(
    <div
      className={cn('z-(--z-bottom-sheet)', 'fixed inset-0', {
        'pointer-events-none': !isOpen,
        'pointer-events-auto': isOpen,
      })}
    >
      {/* App bottom sheet card */}
      <div
        className={cn(
          'bg-white w-full h-full',
          'transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)]',
          'shadow-2xl',
          {
            'translate-y-full': !isOpen,
            'translate-y-0': isOpen,
          }
        )}
      >
        {HeaderComponent ? (
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
