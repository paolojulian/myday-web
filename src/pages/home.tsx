import { AppPageHeader } from '@/components/atoms/app-page-header';
import { HomeOverview } from '@/components/organisms';
import ModalBudgetSetup from '@/components/organisms/modal-budget-setup';
import { FC, useState } from 'react';
import { useUpdateBudget } from '@/hooks/budget/use-update-budget';

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const updateBudget = useUpdateBudget();

  const handleSetBudget = () => {
    setIsBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (amount: number) => {
    await updateBudget.execute(amount);
    setIsBudgetModalOpen(false);
  };

  return (
    <div>
      <section id='home-header'>
        <AppPageHeader title={'My Day'} description={''} />
      </section>

      <section id='home-overview'>
        <HomeOverview onSetBudget={handleSetBudget} />
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
