import CaretLeftIcon from '@/components/atoms/icons/CaretLeftIcon';
import cn from 'classnames';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

type AppBottomSheetProps = {
  onClose: () => void;
  HeaderComponent?: ReactNode | null;
  HeaderRightComponent?: ReactNode;
  shouldHideHeader?: boolean;
  children: ReactNode;
  isOpen: boolean;
  title?: string;
  /** percent/number */
  height?: string;
  variant?: 'full' | 'custom';
  zIndex?: number;
};

const VELOCITY_THRESHOLD = 0.5; // px/ms — dismiss on fast swipe
const DISMISS_RATIO = 0.35; // dismiss if dragged past 35% of sheet height

const AppBottomSheet: FC<AppBottomSheetProps> = ({
  onClose,
  HeaderComponent,
  HeaderRightComponent,
  shouldHideHeader = false,
  children,
  title,
  isOpen = false,
  height = '100%',
  variant = 'full',
  zIndex = 1000,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // Use refs for drag tracking to avoid stale closures
  const drag = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    offset: 0, // current drag offset in px
  });

  // dragOffset drives the visual transform; kept in state for re-renders
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const animateTo = useCallback(
    (from: number, to: number, onDone?: () => void) => {
      cancelAnimationFrame(animFrameRef.current);
      const start = performance.now();
      const duration = 380;

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // Quart ease-out — feels springy without a physics engine
        const eased = 1 - Math.pow(1 - t, 4);
        const value = from + (to - from) * eased;
        drag.current.offset = value;
        setDragOffset(value);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          drag.current.offset = to;
          setDragOffset(to);
          onDone?.();
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    },
    []
  );

  const dismiss = useCallback(() => {
    const sheetHeight = sheetRef.current?.offsetHeight ?? window.innerHeight;
    animateTo(drag.current.offset, sheetHeight, () => onCloseRef.current());
  }, [animateTo]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    cancelAnimationFrame(animFrameRef.current);
    const d = drag.current;
    d.active = true;
    d.startY = e.clientY - d.offset;
    d.lastY = e.clientY;
    d.lastTime = performance.now();
    d.velocity = 0;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;

    const now = performance.now();
    const dt = now - d.lastTime;
    if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastTime = now;

    const rawOffset = e.clientY - d.startY;
    // Rubber-band resistance when pulled upward
    d.offset = rawOffset < 0 ? rawOffset * 0.15 : rawOffset;
    setDragOffset(d.offset);
  }, []);

  const handlePointerUp = useCallback(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    setIsDragging(false);

    const sheetHeight = sheetRef.current?.offsetHeight ?? window.innerHeight;
    const ratio = d.offset / sheetHeight;

    if (d.velocity > VELOCITY_THRESHOLD || ratio > DISMISS_RATIO) {
      dismiss();
    } else {
      animateTo(d.offset, 0);
    }
  }, [dismiss, animateTo]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Reset offset on open; clean up animation on unmount
  useEffect(() => {
    if (isOpen) {
      drag.current.offset = 0;
      setDragOffset(0);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen]);

  // Backdrop opacity: tied to drag position for tactile feedback
  const sheetHeight = sheetRef.current?.offsetHeight ?? 1;
  const dragRatio = Math.max(0, Math.min(1, 1 - dragOffset / sheetHeight));
  const backdropOpacity = isOpen ? dragRatio * 0.5 : 0;

  const sheetTransform = isOpen
    ? `translateY(${Math.max(0, dragOffset)}px)`
    : 'translateY(100%)';

  const dragHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };

  return ReactDOM.createPortal(
    <div
      className={cn('fixed inset-0 flex flex-col justify-end', {
        'pointer-events-none': !isOpen,
        'pointer-events-auto': isOpen,
      })}
      style={{ zIndex }}
      role='dialog'
      aria-modal='true'
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black transition-opacity duration-500'
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative bg-white w-full mt-auto flex flex-col',
          'shadow-2xl will-change-transform',
          {
            'rounded-t-3xl': variant !== 'full',
            // Only use CSS transitions when not manually dragging or spring-animating
            'transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]':
              !isDragging,
          }
        )}
        style={{
          height: variant === 'full' ? height : undefined,
          maxHeight: height,
          transform: sheetTransform,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          touchAction: 'none',
        }}
      >
        {/* Drag handle */}
        {variant !== 'full' && (
          <div
            className='flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none'
            {...dragHandlers}
          >
            <div className='w-9 h-[5px] rounded-full bg-gray-300 transition-colors' />
          </div>
        )}

        {/* Header */}
        {shouldHideHeader ? null : HeaderComponent ? (
          <div
            className='cursor-grab active:cursor-grabbing select-none'
            {...dragHandlers}
          >
            {HeaderComponent}
          </div>
        ) : (
          <div
            className='grid grid-cols-[1fr_auto_1fr] p-4 items-center cursor-grab active:cursor-grabbing select-none'
            {...dragHandlers}
          >
            <button
              onClick={onClose}
              className='justify-self-start p-1 -ml-1 rounded-full'
              aria-label='Close'
            >
              <CaretLeftIcon />
            </button>
            <span className='font-medium text-sm'>{title}</span>
            <div className='justify-self-end'>{HeaderRightComponent}</div>
          </div>
        )}

        {/* Scrollable content */}
        <div
          className='flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 h-full'
          // Prevent drag-to-dismiss when scrolling inside content
          onPointerDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppBottomSheet;
