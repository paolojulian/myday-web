import { toCurrency } from '@/lib/currency.utils';
import { FC } from 'react';

type CardBudgetProps = {
  monthlyBudget: number | null; // null if no budget is set
  remainingBudget: number;
};

const CardBudget: FC<CardBudgetProps> = ({
  monthlyBudget,
  remainingBudget
}) => {
  if (monthlyBudget === null) {
    return (
      <div>No monthly budget set, set one now</div>
    )
  }

  return (
    <div>
      <section>
        <label>Remaining Budget:</label>
        <p>{toCurrency(remainingBudget)}</p>
      </section>
      <section>
        <label>Monthly Budget:</label>
        <p>{toCurrency(monthlyBudget)}</p>
      </section>
    </div>
  );
};

export default CardBudget;