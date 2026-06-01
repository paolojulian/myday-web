type NavigationPillProps = {
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled: boolean;
  label: string;
};

const NavigationPill = ({
  onNext,
  onPrev,
  isNextDisabled,
  label,
}: NavigationPillProps) => {
  return (
    <div
      className="fixed inset-x-0 z-10 flex items-center justify-center pb-20"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="flex items-center gap-1 bg-neutral-900 text-white rounded-full px-2 py-1.5 shadow-xl shadow-neutral-900/30"
        style={{}}
      >
        <button
          onClick={() => {
            navigator.vibrate?.(8);
            onPrev();
          }}
          className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Previous day"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="text-sm font-semibold px-2 whitespace-nowrap w-28 text-center">
          {label}
        </span>

        <button
          onClick={() => {
            if (!isNextDisabled) {
              navigator.vibrate?.(8);
              onNext();
            }
          }}
          disabled={isNextDisabled}
          className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NavigationPill;
