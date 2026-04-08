import { AppPageHeader } from '@/components/atoms/app-page-header';
import { HomeOverview } from '@/components/organisms';
import ModalBudgetSetup from '@/components/organisms/modal-budget-setup';
import { useBudgetAnalysis } from '@/hooks/budget/use-budget-analysis';
import { useUpdateBudget } from '@/hooks/budget/use-update-budget';
import { FC, useMemo, useState } from 'react';

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const updateBudget = useUpdateBudget();
  const currentMonth = useMemo(() => new Date(), []);
  const budgetAnalysis = useBudgetAnalysis(currentMonth);

  const currentBudgetAmount = budgetAnalysis.data?.monthlyBudget ?? undefined;

  const handleSetBudget = () => {
    setIsBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (amount: number) => {
    await updateBudget.execute(amount);
    setIsBudgetModalOpen(false);
  };

  return (
    <div className='pb-44'>
      <section id='home-header'>
        <AppPageHeader title={'Xpense'} description={''} />
      </section>

      <section id='home-overview'>
        <HomeOverview
          onSetBudget={handleSetBudget}
          onEditBudget={currentBudgetAmount !== undefined ? handleSetBudget : undefined}
        />
      </section>

      <ModalBudgetSetup
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSubmit={handleBudgetSubmit}
        initialAmount={currentBudgetAmount}
      />
    </div>
  );
};

export default Home;
