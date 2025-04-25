import { toCurrency } from "@/lib/currency.utils";

const HomeRecentTransactions = () => {
  return (
    <div className="py-4 text-left">
      <h2>Recent Transactions</h2>
      <div className="flex flex-col gap-2 mt-2">
        <Item title="Lunch at Jollibee" subtitle="Restaurant" amount={-890} />
        <Item title="Dinner at Max" subtitle="Restaurant" amount={-1000} />
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
