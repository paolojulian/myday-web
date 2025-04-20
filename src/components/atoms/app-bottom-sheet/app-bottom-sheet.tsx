import cn from 'classnames';
import { FC, ReactNode } from 'react';
import ReactDOM from 'react-dom';

type AppBottomSheetProps = {
  onClose: () => void;
  children: ReactNode;
  isOpen: boolean;
};

const AppBottomSheet: FC<AppBottomSheetProps> = ({
  onClose,
  children,
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
        onClick={onClose}
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
        {children}
      </div>
    </div>,
    document.body
  );
};

export default AppBottomSheet;
