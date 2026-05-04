import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/repository';

export const useInvestmentAccountsLive = () => {
  return useLiveQuery(async () => {
    const [accounts, holdings] = await Promise.all([
      db.investmentAccounts.orderBy('name').toArray(),
      db.investmentHoldings.toArray(),
    ]);

    return accounts.map((account) => {
      const accountHoldings = holdings.filter(
        (holding) => holding.account_id === account.id
      );

      return {
        ...account,
        holdingsCount: accountHoldings.length,
        currentValue: accountHoldings.reduce(
          (total, holding) => total + holding.current_value,
          0
        ),
      };
    });
  }, []);
};
