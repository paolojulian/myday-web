import { describe, expect, it } from 'vitest';
import {
  buildPortfolioOverview,
  buildInvestmentProjectionScenarios,
  calculateInvestmentProjection,
  calculateReturnPercent,
  getTransactionCashImpact,
  toPhpValue,
} from './investment.utils';
import {
  InvestmentAccount,
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '@/repository';

describe('investment utils', () => {
  it('converts USD values to PHP using the provided rate', () => {
    expect(toPhpValue(100, InvestmentCurrency.USD, 58)).toBe(5800);
    expect(toPhpValue(100, InvestmentCurrency.PHP, 58)).toBe(100);
  });

  it('calculates return percent safely', () => {
    expect(calculateReturnPercent(1200, 1000)).toBe(20);
    expect(calculateReturnPercent(1200, 0)).toBe(0);
  });

  it('calculates cash impact by transaction type', () => {
    expect(
      getTransactionCashImpact({
        type: InvestmentTransactionType.Buy,
        amount: 1000,
        fees: 10,
      })
    ).toBe(1010);

    expect(
      getTransactionCashImpact({
        type: InvestmentTransactionType.Sell,
        amount: 1000,
        fees: 10,
      })
    ).toBe(-990);
  });

  it('builds portfolio totals, allocation, and current-month contributions for simple balances', () => {
    const accounts: InvestmentAccount[] = [
      {
        id: 'mp2',
        name: 'MP2',
        type: InvestmentAccountType.MP2,
        currency: InvestmentCurrency.PHP,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'cash',
        name: 'Emergency Fund',
        type: InvestmentAccountType.Cash,
        currency: InvestmentCurrency.PHP,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    const holdings: InvestmentHolding[] = [
      {
        id: 'mp2-holding',
        account_id: 'mp2',
        name: 'MP2',
        quantity: 1,
        cost_basis: 12000,
        current_price: 12000,
        current_value: 12000,
        expected_annual_return_percent: 6.5,
        currency: InvestmentCurrency.PHP,
        price_source: 'manual',
        price_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'cash-holding',
        account_id: 'cash',
        name: 'Emergency Fund',
        quantity: 1,
        cost_basis: 100000,
        current_price: 100000,
        current_value: 100000,
        expected_annual_return_percent: 4,
        currency: InvestmentCurrency.PHP,
        price_source: 'manual',
        price_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    const transactions: InvestmentTransaction[] = [
      {
        id: 'transaction',
        account_id: 'mp2',
        holding_id: 'mp2-holding',
        type: InvestmentTransactionType.Deposit,
        transaction_date: new Date('2026-05-04'),
        amount: 5000,
        currency: InvestmentCurrency.PHP,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const overview = buildPortfolioOverview({
      accounts,
      holdings,
      transactions,
      now: new Date('2026-05-10'),
      usdToPhp: 58,
    });

    expect(overview.totalValuePhp).toBe(112000);
    expect(overview.totalCostBasisPhp).toBe(112000);
    expect(overview.cashValuePhp).toBe(100000);
    expect(overview.monthlyContributionsPhp).toBe(5000);
    expect(overview.expectedAnnualReturnPercent).toBeCloseTo(4.27, 2);
    expect(overview.allocation[0].label).toBe('Cash');
  });

  it('does not report a tracked projection rate when a positive holding has no expected rate', () => {
    const accounts: InvestmentAccount[] = [
      {
        id: 'stocks',
        name: 'IBKR',
        type: InvestmentAccountType.Stocks,
        currency: InvestmentCurrency.USD,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'mp2',
        name: 'MP2',
        type: InvestmentAccountType.MP2,
        currency: InvestmentCurrency.PHP,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];
    const holdings: InvestmentHolding[] = [
      {
        id: 'qqq',
        account_id: 'stocks',
        name: 'QQQ',
        symbol: 'QQQ',
        quantity: 1,
        cost_basis: 500,
        current_price: 500,
        current_value: 500,
        expected_annual_return_percent: null,
        currency: InvestmentCurrency.USD,
        price_source: 'manual',
        price_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'mp2-holding',
        account_id: 'mp2',
        name: 'MP2',
        quantity: 1,
        cost_basis: 12000,
        current_price: 12000,
        current_value: 12000,
        expected_annual_return_percent: 6.5,
        currency: InvestmentCurrency.PHP,
        price_source: 'manual',
        price_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const overview = buildPortfolioOverview({
      accounts,
      holdings,
      transactions: [],
      usdToPhp: 58,
    });

    expect(overview.expectedAnnualReturnPercent).toBeNull();
  });

  it('projects future value from current value and monthly contributions', () => {
    const projection = calculateInvestmentProjection({
      currentValue: 100000,
      monthlyContribution: 10000,
      annualReturnPercent: 6,
      years: 10,
    });

    expect(projection.futureValue).toBeGreaterThan(1300000);
    expect(projection.totalContributions).toBe(1200000);
    expect(projection.estimatedGrowth).toBeGreaterThan(0);
  });

  it('builds conservative, planned, and optimistic projection scenarios', () => {
    const scenarios = buildInvestmentProjectionScenarios({
      currentValue: 100000,
      monthlyContribution: 10000,
      annualReturnPercent: 6,
      years: 10,
    });

    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      'conservative',
      'planned',
      'optimistic',
    ]);
    expect(scenarios.map((scenario) => scenario.annualReturnPercent)).toEqual([
      4,
      6,
      8,
    ]);
    expect(scenarios[0].futureValue).toBeLessThan(scenarios[1].futureValue);
    expect(scenarios[1].futureValue).toBeLessThan(scenarios[2].futureValue);
    expect(scenarios[1].totalContributions).toBe(1200000);
  });
});
