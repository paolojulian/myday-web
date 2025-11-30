import { AppPageHeader } from '@/components/atoms/app-page-header';
import { HomeOverview, HomeRecentTransactions } from '@/components/organisms';
import ModalBudgetSetup from '@/components/organisms/modal-budget-setup';
import { FC, useState } from 'react';
import useRecentTransactions from '../hooks/expenses/use-recent-transactions';
import { useUpdateBudget } from '@/hooks/budget/use-update-budget';

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  const [dateFilter] = useState<Date>(new Date());
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const recentTransactionsQuery = useRecentTransactions();
  const updateBudget = useUpdateBudget();

  const handleSetBudget = () => {
    setIsBudgetModalOpen(true);
  };

  const handleBudgetSubmit = (amount: number) => {
    updateBudget.mutate(amount, {
      onSuccess: () => {
        setIsBudgetModalOpen(false);
      },
    });
  };

  return (
    <div>
      <section id='home-header'>
        <AppPageHeader title={'My Day'} description={''} />
      </section>

      <section id='home-overview'>
        <HomeOverview date={dateFilter} onSetBudget={handleSetBudget} />
      </section>

      <section id='home-recent-transactions'>
        <HomeRecentTransactions
          recentTransactions={recentTransactionsQuery.data}
          isLoading={recentTransactionsQuery.isLoading}
          error={recentTransactionsQuery.error}
        />
      </section>

      <ModalBudgetSetup
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSubmit={handleBudgetSubmit}
      />
    </div>
  );
};

export default Home;
