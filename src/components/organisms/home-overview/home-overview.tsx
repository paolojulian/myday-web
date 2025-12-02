import { FC } from 'react';
import { useBudgetAnalysis } from '@/hooks/budget/use-budget-analysis';
import { useSpentTodayLive } from '@/hooks/expenses/use-spent-today-live';
import CardSpentToday from '@/components/molecules/card-spent-today';
import CardRemainingBudget from '@/components/molecules/card-remaining-budget';
import CardSpendingRate from '@/components/molecules/card-spending-rate';
import CardBudgetProjection from '@/components/molecules/card-budget-projection';
import CardNoBudget from '@/components/molecules/card-no-budget';
import AppDelayLoader from '@/components/atoms/app-delay-loader';

type HomeOverviewProps = {
  date?: Date;
  onSetBudget?: () => void;
};

const HomeOverview: FC<HomeOverviewProps> = ({
  date = new Date(),
  onSetBudget,
}) => {
  const spentToday = useSpentTodayLive();
  const budgetAnalysisQuery = useBudgetAnalysis(date);

  const hasBudget = budgetAnalysisQuery.data !== null;
  const isLoading = budgetAnalysisQuery.isLoading;

  if (isLoading) {
    return (
      <AppDelayLoader>
        <div className='py-4 text-center'>
          <p className='text-neutral-500'>Loading dashboard...</p>
        </div>
      </AppDelayLoader>
    );
  }

  return (
    <div className='py-4'>
      {hasBudget && budgetAnalysisQuery.data ? (
        // Single column grid with Budget
        <div className='grid grid-cols-1 gap-2'>
          <CardSpentToday
            amount={spentToday}
            isLoading={false}
          />

          <CardRemainingBudget
            analysis={budgetAnalysisQuery.data}
            isLoading={budgetAnalysisQuery.isLoading}
          />

          <CardSpendingRate
            analysis={budgetAnalysisQuery.data}
            isLoading={budgetAnalysisQuery.isLoading}
          />

          <CardBudgetProjection
            analysis={budgetAnalysisQuery.data}
            isLoading={budgetAnalysisQuery.isLoading}
          />
        </div>
      ) : (
        // Single column: Spent Today + No Budget Prompt
        <div className='grid grid-cols-1 gap-4'>
          <CardSpentToday
            amount={spentToday}
            isLoading={false}
          />

          <CardNoBudget onSetBudget={onSetBudget} />
        </div>
      )}
    </div>
  );
};

export default HomeOverview;
