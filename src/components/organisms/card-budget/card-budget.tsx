import AppTypography from '@/components/atoms/app-typography';
import DashboardCard from '@/components/molecules/dashboard-card';
import CardNoBudget from '@/components/molecules/card-no-budget';
import { toCurrency } from '@/lib/currency.utils';
import { BudgetStatus } from '@/lib/budget.utils';
import { FC } from 'react';

type CardBudgetProps = {
  monthlyBudget: number | null; // null if no budget is set
  remainingBudget: number;
  onSetBudget?: () => void;
};

function getBudgetStatus(
  remainingBudget: number,
  monthlyBudget: number
): BudgetStatus {
  const percentageUsed =
    ((monthlyBudget - remainingBudget) / monthlyBudget) * 100;
  if (remainingBudget <= 0 || percentageUsed > 90) {
    return 'danger';
  } else if (percentageUsed > 75) {
    return 'warning';
  }
  return 'healthy';
}

const CardBudget: FC<CardBudgetProps> = ({
  monthlyBudget,
  remainingBudget,
  onSetBudget,
}) => {
  if (monthlyBudget === null) {
    return <CardNoBudget onSetBudget={onSetBudget} />;
  }

  const status = getBudgetStatus(remainingBudget, monthlyBudget);

  return (
    <div className="grid grid-cols-2 gap-2">
      <DashboardCard status={status}>
        <div className="flex flex-col">
          <AppTypography variant="small" className="text-neutral-600 mb-2">
            Remaining Budget
          </AppTypography>
          <AppTypography as="h2" className="font-bold" variant="heading">
            {toCurrency(remainingBudget)}
          </AppTypography>
        </div>
      </DashboardCard>

      <DashboardCard status="neutral">
        <div className="flex flex-col">
          <AppTypography variant="small" className="text-neutral-600 mb-2">
            Monthly Budget
          </AppTypography>
          <AppTypography as="h2" className="font-bold" variant="heading">
            {toCurrency(monthlyBudget)}
          </AppTypography>
        </div>
      </DashboardCard>
    </div>
  );
};

export default CardBudget;