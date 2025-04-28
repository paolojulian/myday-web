import AppDelayLoader from "@/components/atoms/app-delay-loader";
import { toCurrency } from "@/lib/currency.utils";
import { Expense } from "@/repository";
import { FC } from "react";

type Props = {
  recentTransactions: Expense[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const HomeRecentTransactions: FC<Props> = ({ recentTransactions, isLoading, error }) => {
  return (
    <div className="py-4 text-left">
      <div className="flex flex-col gap-2 mt-2">
        <Item title="Lunch at Jollibee" subtitle="Restaurant" amount={-890} />
        <Item title="Dinner at Max" subtitle="Restaurant" amount={-1000} />
      </div>
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
            <Item key={recentTransaction.id} title={recentTransaction.title} subtitle={recentTransaction.description || ''} amount={recentTransaction.amount} />
          ))}
        </div>
    </div>
  );
};

const Item = ({
  title,
  subtitle,
  amount,
}: {
  title: string;
  subtitle: string;
  amount: number;
}) => {
  return (
    <div className="flex flex-row items-center justify-between">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div>
        <p>{toCurrency(amount)}</p>
      </div>
    </div>
  );
};

export default HomeRecentTransactions;
