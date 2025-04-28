import { AppPageHeader } from "@/components/atoms/app-page-header";
import { HomeOverview, HomeRecentTransactions } from "@/components/organisms";
import { FC, useState } from 'react';
import { useBudget } from '../hooks/budget/use-budget';
import useRecentTransactions from '../hooks/expenses/use-recent-transactions';

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  const [dateFilter] = useState<Date>(new Date());
  const { data: remainingBudget } = useBudget(dateFilter);
  const {
    data: recentTransactions,
    isLoading,
    error,
  } = useRecentTransactions();
  const amountSpentToday: number = recentTransactions?.reduce((acc, transaction) => {
    return acc + transaction.amount;
  }, 0) || 0;


  return (
    <div>
      <section id="home-header">
        <AppPageHeader title={"My Day"} description={"April 25, 2025"} />
      </section>

      <section id="home-overview">
        <HomeOverview remainingBudget={remainingBudget?.amount} spentToday={amountSpentToday} />
      </section>

      <section id="home-recent-transactions">
        <HomeRecentTransactions recentTransactions={recentTransactions} isLoading={isLoading} error={error} />
      </section>
    </div>
  );
};

export default Home;
