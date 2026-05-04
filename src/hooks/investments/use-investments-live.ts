import { useLiveQuery } from 'dexie-react-hooks';
import { buildPortfolioOverview } from '@/lib/investment.utils';
import { db } from '@/repository';

export const useInvestmentsLive = () => {
  return useLiveQuery(async () => {
    const [accounts, holdings, transactions] = await Promise.all([
      db.investmentAccounts.toArray(),
      db.investmentHoldings.toArray(),
      db.investmentTransactions.toArray(),
    ]);

    return {
      accounts,
      holdings,
      transactions,
      overview: buildPortfolioOverview({
        accounts,
        holdings,
        transactions,
      }),
    };
  }, []);
};
