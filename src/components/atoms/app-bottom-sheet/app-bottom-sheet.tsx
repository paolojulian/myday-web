import cn from "classnames";
import { FC, ReactNode } from "react";
import ReactDOM from "react-dom";

type AppBottomSheetProps = {
  onClose: () => void;
  children: ReactNode;
  isOpen: boolean;
  hasCloseButton?: boolean;
};

const AppBottomSheet: FC<AppBottomSheetProps> = ({
  onClose,
  children,
  isOpen = false,
  hasCloseButton = false,
}) => {
  return ReactDOM.createPortal(
    <div
      className={cn("z-(--z-bottom-sheet)", "fixed inset-0", {
        "pointer-events-none": !isOpen,
        "pointer-events-auto": isOpen,
      })}
    >
      {/* App bottom sheet card */}
      <div
        className={cn(
          "bg-white w-full h-full",
          "transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)]",
          "shadow-2xl",
          "p-4",
          {
            "translate-y-full": !isOpen,
            "translate-y-0": isOpen,
          },
        )}
      >
        {children}
      </div>

      {/* Close button */}
      {hasCloseButton && (
        <div
          className={cn(
            "fixed bottom-0 inset-x-0 transition-all duration-300",
            {
              "pointer-events-none opacity-0": !isOpen,
              "opacity-100": isOpen,
            },
          )}
        >
          <div className="pb-8 flex flex-row justify-center">
            <button
              onClick={onClose}
              className="p-4 aspect-square w-14 h-14 rounded-full border"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default AppBottomSheet;
