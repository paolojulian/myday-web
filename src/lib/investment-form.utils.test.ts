import { describe, expect, it } from 'vitest';
import {
  getInvestmentAccountOptions,
  resolveInvestmentAccountSelection,
} from './investment-form.utils';
import {
  InvestmentAccount,
  InvestmentAccountType,
  InvestmentCurrency,
} from '@/repository';

const ACCOUNTS: InvestmentAccount[] = [
  {
    id: 'inv-account-1',
    name: 'IBKR',
    type: InvestmentAccountType.Stocks,
    currency: InvestmentCurrency.USD,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'inv-account-2',
    name: 'MP2',
    type: InvestmentAccountType.MP2,
    currency: InvestmentCurrency.PHP,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('investment form helpers', () => {
  it('builds picker options from existing investment accounts', () => {
    expect(getInvestmentAccountOptions(ACCOUNTS)).toEqual([
      { label: 'IBKR', value: 'inv-account-1' },
      { label: 'MP2', value: 'inv-account-2' },
    ]);
  });

  it('resolves an existing account selection by id', () => {
    expect(
      resolveInvestmentAccountSelection({
        accounts: ACCOUNTS,
        accountValue: 'inv-account-1',
        fallbackType: InvestmentAccountType.MP2,
        fallbackCurrency: InvestmentCurrency.PHP,
      })
    ).toEqual({
      accountName: 'IBKR',
      accountType: InvestmentAccountType.Stocks,
      currency: InvestmentCurrency.USD,
      selectedAccountId: 'inv-account-1',
      isExistingAccount: true,
    });
  });

  it('resolves a custom account name using the selected type and currency', () => {
    expect(
      resolveInvestmentAccountSelection({
        accounts: ACCOUNTS,
        accountValue: 'COL Financial',
        fallbackType: InvestmentAccountType.PSE,
        fallbackCurrency: InvestmentCurrency.PHP,
      })
    ).toEqual({
      accountName: 'COL Financial',
      accountType: InvestmentAccountType.PSE,
      currency: InvestmentCurrency.PHP,
      selectedAccountId: null,
      isExistingAccount: false,
    });
  });
});
