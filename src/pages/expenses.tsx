import { AppPageHeader } from '@/components/atoms';
import AppDelayLoader from '@/components/atoms/app-delay-loader';
import AppTypography from '@/components/atoms/app-typography';
import ExpenseItem from '@/components/molecules/expense-item';
import CardRemainingBudget from '@/components/molecules/card-remaining-budget';
import DashboardCard from '@/components/molecules/dashboard-card';
import { FilterExpenses } from '../components/organisms/filter-expenses';
import { useBudgetAnalysis } from '@/hooks/budget/use-budget-analysis';
import { useCategories } from '@/hooks/categories/use-categories';
import { useExpensesWithCategoryLive } from '@/hooks/expenses/use-expenses-with-category-live';
import { toCurrency } from '@/lib/currency.utils';
import { FC, useMemo, useState } from 'react';

type ExpensesProps = object;

const Expenses: FC<ExpensesProps> = () => {
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const budgetAnalysisQuery = useBudgetAnalysis(transactionDate);
  const expenses = useExpensesWithCategoryLive(transactionDate);
  const { data: categories } = useCategories();

  const hasBudget = budgetAnalysisQuery.data !== null;

  const filteredExpenses = useMemo(() => {
    if (!selectedCategoryId) return expenses;
    return expenses?.filter((e) => e.category_id === selectedCategoryId);
  }, [expenses, selectedCategoryId]);

  return (
    <div>
      <section id='expenses-header'>
        <AppPageHeader title={'My Day'} description={'Expenses'} />
      </section>

      <FilterExpenses
        onChangeTransactionDate={setTransactionDate}
        transactionDate={transactionDate}
      />

      {/* Budget summary */}
      {hasBudget && budgetAnalysisQuery.data && (
        <div className='grid grid-cols-2 gap-2 my-4'>
          <CardRemainingBudget
            analysis={budgetAnalysisQuery.data}
            isLoading={budgetAnalysisQuery.isLoading}
          />
          <DashboardCard status={budgetAnalysisQuery.data.status}>
            <div className='flex flex-col'>
              <AppTypography variant='small' className='text-neutral-600 mb-2'>
                Remaining
              </AppTypography>
              <AppTypography as='h2' variant='heading' className='font-bold'>
                {toCurrency(budgetAnalysisQuery.data.remainingBudget)}
              </AppTypography>
              <AppTypography variant='small' className='text-neutral-500 mt-1'>
                of {toCurrency(budgetAnalysisQuery.data.monthlyBudget)}
              </AppTypography>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* Category filter pills */}
      {categories && categories.length > 0 && (
        <div className='flex gap-2 overflow-x-auto pb-2 mt-2 no-scrollbar'>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                setSelectedCategoryId(
                  selectedCategoryId === category.id ? null : (category.id ?? null)
                )
              }
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Expense list */}
      <div className='flex flex-col gap-2 mt-4'>
        {filteredExpenses === undefined && (
          <AppDelayLoader>
            <div className='text-center py-8'>
              <AppTypography variant='body2' className='text-neutral-500'>
                Loading...
              </AppTypography>
            </div>
          </AppDelayLoader>
        )}

        {filteredExpenses !== undefined && filteredExpenses.length === 0 && (
          <div className='text-center py-8'>
            <AppTypography variant='body2' className='text-neutral-500'>
              No expenses this month
            </AppTypography>
          </div>
        )}

        {filteredExpenses?.map((expense) => (
          <ExpenseItem key={expense.id} expense={expense} showDate />
        ))}
      </div>
    </div>
  );
};

export default Expenses;
