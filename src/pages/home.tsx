import { FC, useState } from 'react';
import { useBudget } from '../hooks/budget/use-budget';
import { useUpdateBudget } from '../hooks/budget/use-update-budget';
import useRecentTransactions from '../hooks/expenses/use-recent-transactions';
import { toCurrency } from '../lib/currency.utils';
import AppDelayLoader from '../components/atoms/app-delay-loader';

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  const [dateFilter] = useState<Date>(new Date());
  const { data } = useBudget(dateFilter);
  const {
    data: recentTransactions,
    isLoading,
    error,
  } = useRecentTransactions();
  const budgetMutation = useUpdateBudget();

  const dummyAdd = () => {
    budgetMutation.mutate(40000);
  };

  return (
    <div>
      {/* TODO: Separate into a new component */}
      <section id='home-budget'>
        <h2>Budget</h2>
        {data ? (
          <div>
            <p>Budget: {data.amount}</p>
            <p>Created at: {data.created_at.toString()}</p>
          </div>
        ) : (
          <p>No budget found</p>
        )}

        <button onClick={dummyAdd}>Test budget</button>
      </section>

      {/* TODO: Separate into a new component */}
      <section id='home-recent-transactions' className='text-left'>
        <h2>Recent Transactions</h2>
        <div className='flex flex-col gap-2'>
          {isLoading ? (
            <AppDelayLoader>
              {/* TODO: Add a design */}
              <div>Loading...</div>
            </AppDelayLoader>
          ) : null}

          {/* TODO: Add a design */}
          {error ? <div>Error: {error.message}</div> : null}

          {recentTransactions?.map((recentTransaction) => (
            <div
              key={recentTransaction.id}
              className='flex flex-row justify-between p-2 border'
            >
              <h3>{recentTransaction.title}</h3>
              <p>{toCurrency(recentTransaction.amount)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
