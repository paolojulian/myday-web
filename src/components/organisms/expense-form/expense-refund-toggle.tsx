type ExpenseRefundValue = 'expense' | 'refund';

type ExpenseRefundToggleProps = {
  onToggle: (value: ExpenseRefundValue) => void;
  value: ExpenseRefundValue;
};

export const ExpenseRefundToggle = ({
  onToggle,
  value,
}: ExpenseRefundToggleProps) => {
  const handleExpenseToggle = () => onToggle('expense');
  const handleRefundToggle = () => onToggle('refund');

  return (
    <div className='flex p-1 bg-neutral-100 rounded-xl mb-2'>
      <button
        type='button'
        onClick={handleExpenseToggle}
        className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all active:scale-95 ${
          value === 'expense'
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-400'
        }`}
      >
        Expense
      </button>
      <button
        type='button'
        onClick={handleRefundToggle}
        className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all active:scale-95 ${
          value === 'refund'
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-400'
        }`}
      >
        Refund
      </button>
    </div>
  );
};
