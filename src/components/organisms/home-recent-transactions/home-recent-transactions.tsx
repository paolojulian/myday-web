import AppDelayLoader from "@/components/atoms/app-delay-loader";
import { toCurrency } from "@/lib/currency.utils";
import { getDateFormat } from "@/lib/dates.utils";
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
        <h2>Recent Transactions</h2>
        <div className='flex flex-col gap-2 mt-2'>
          {isLoading ? (
            <AppDelayLoader>
              {/* TODO: Add a design */}
              <div>Loading...</div>
            </AppDelayLoader>
          ) : null}

          {/* TODO: Add a design */}
          {error ? <div>Error: {error.message}</div> : null}

          {recentTransactions !== undefined && recentTransactions.length === 0 && !isLoading && (
            <div>
              <p>No recent transactions</p>
            </div>
          )}

          {recentTransactions?.map((recentTransaction) => (
            <Item 
              key={recentTransaction.id}
              title={recentTransaction.title}
              subtitle={recentTransaction.description || ''}
              amount={recentTransaction.amount}
              transactionDate={recentTransaction.transaction_date}
            />
          ))}
        </div>
    </div>
  );
};

const Item = ({
  title,
  subtitle,
  amount,
  transactionDate,
}: {
  title: string;
  subtitle: string;
  amount: number;
  transactionDate: Date;
}) => {
  return (
    <div className="flex flex-row items-center justify-between border p-4">
      <div>
        <div>
        <h2>{title}</h2>
        <small>{subtitle}</small>
        </div>
        <div>
          <small>{getDateFormat(transactionDate, 'MMM-DD-YYYY')}</small>
        </div>
      </div>
      <div>
        <p>{toCurrency(amount)}</p>
      </div>
    </div>
  );
};

export default HomeRecentTransactions;
