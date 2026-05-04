import {
  InvestmentAccount,
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '@/repository';

export const DEFAULT_USD_TO_PHP = 58;

export type InvestmentHoldingWithAccount = InvestmentHolding & {
  account?: InvestmentAccount;
};

export type AllocationItem = {
  key: string;
  label: string;
  value: number;
  percentage: number;
};

export type InvestmentInsight = {
  id: string;
  tone: 'danger' | 'warning' | 'success' | 'neutral';
  title: string;
  description: string;
};

export type PortfolioOverview = {
  totalValuePhp: number;
  totalCostBasisPhp: number;
  unrealizedGainPhp: number;
  returnPercent: number;
  monthlyContributionsPhp: number;
  expectedAnnualReturnPercent: number | null;
  cashValuePhp: number;
  investedValuePhp: number;
  allocation: AllocationItem[];
  accountBreakdown: AllocationItem[];
  contributionHistory: AllocationItem[];
  insights: InvestmentInsight[];
};

export type ProjectionResult = {
  years: number;
  futureValue: number;
  totalContributions: number;
  estimatedGrowth: number;
};

export type ProjectionScenario = ProjectionResult & {
  id: 'conservative' | 'planned' | 'optimistic';
  label: string;
  annualReturnPercent: number;
};

export function toPhpValue(
  amount: number,
  currency: InvestmentCurrency,
  usdToPhp = DEFAULT_USD_TO_PHP
): number {
  return currency === InvestmentCurrency.USD ? amount * usdToPhp : amount;
}

export function calculateHoldingValue(quantity: number, price: number): number {
  if (quantity <= 0) return 0;
  return quantity * price;
}

export function calculateReturnPercent(
  currentValue: number,
  costBasis: number
): number {
  if (costBasis <= 0) return 0;
  return ((currentValue - costBasis) / costBasis) * 100;
}

export function getTransactionCashImpact(
  transaction: Pick<InvestmentTransaction, 'type' | 'amount' | 'fees'>
): number {
  const fees = transaction.fees ?? 0;

  switch (transaction.type) {
    case InvestmentTransactionType.Buy:
    case InvestmentTransactionType.Deposit:
      return transaction.amount + fees;
    case InvestmentTransactionType.Sell:
    case InvestmentTransactionType.Withdrawal:
      return -(transaction.amount - fees);
    case InvestmentTransactionType.Fee:
      return fees || transaction.amount;
    case InvestmentTransactionType.Dividend:
    case InvestmentTransactionType.Interest:
    case InvestmentTransactionType.PriceUpdate:
      return 0;
  }
}

export function buildPortfolioOverview(params: {
  accounts: InvestmentAccount[];
  holdings: InvestmentHolding[];
  transactions: InvestmentTransaction[];
  now?: Date;
  usdToPhp?: number;
}): PortfolioOverview {
  const {
    accounts,
    holdings,
    transactions,
    now = new Date(),
    usdToPhp = DEFAULT_USD_TO_PHP,
  } = params;

  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const totalValuePhp = holdings.reduce(
    (sum, holding) =>
      sum + toPhpValue(holding.current_value, holding.currency, usdToPhp),
    0
  );
  const totalCostBasisPhp = holdings.reduce(
    (sum, holding) =>
      sum + toPhpValue(holding.cost_basis, holding.currency, usdToPhp),
    0
  );
  const cashValuePhp = holdings.reduce((sum, holding) => {
    const account = accountMap.get(holding.account_id);
    if (account?.type !== InvestmentAccountType.Cash) return sum;
    return sum + toPhpValue(holding.current_value, holding.currency, usdToPhp);
  }, 0);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyContributionsPhp = transactions.reduce((sum, transaction) => {
    const date = new Date(transaction.transaction_date);
    const isThisMonth =
      date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    if (!isThisMonth) return sum;

    const impact = getTransactionCashImpact(transaction);
    if (impact <= 0) return sum;

    return sum + toPhpValue(impact, transaction.currency, usdToPhp);
  }, 0);
  const expectedAnnualReturnPercent = calculateWeightedExpectedReturn(
    holdings,
    usdToPhp
  );

  const allocationMap = new Map<string, { label: string; value: number }>();
  const accountBreakdownMap = new Map<string, { label: string; value: number }>();

  holdings.forEach((holding) => {
    const account = accountMap.get(holding.account_id);
    const type = account?.type ?? InvestmentAccountType.Other;
    const value = toPhpValue(holding.current_value, holding.currency, usdToPhp);

    const currentType = allocationMap.get(type);
    allocationMap.set(type, {
      label: formatAccountType(type),
      value: (currentType?.value ?? 0) + value,
    });

    const accountKey = account?.id ?? holding.account_id;
    const currentAccount = accountBreakdownMap.get(accountKey);
    accountBreakdownMap.set(accountKey, {
      label: account?.name ?? 'Unassigned',
      value: (currentAccount?.value ?? 0) + value,
    });
  });

  const contributionMap = new Map<string, number>();
  transactions.forEach((transaction) => {
    const impact = getTransactionCashImpact(transaction);
    if (impact <= 0) return;

    const date = new Date(transaction.transaction_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    const value = toPhpValue(impact, transaction.currency, usdToPhp);
    contributionMap.set(key, (contributionMap.get(key) ?? 0) + value);
  });

  const allocation = toAllocationItems(allocationMap, totalValuePhp);
  const accountBreakdown = toAllocationItems(accountBreakdownMap, totalValuePhp);
  const contributionHistory = Array.from(contributionMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => ({
      key,
      label: key,
      value,
      percentage: monthlyContributionsPhp
        ? Math.min((value / monthlyContributionsPhp) * 100, 100)
        : 0,
    }));

  return {
    totalValuePhp,
    totalCostBasisPhp,
    unrealizedGainPhp: totalValuePhp - totalCostBasisPhp,
    returnPercent: calculateReturnPercent(totalValuePhp, totalCostBasisPhp),
    monthlyContributionsPhp,
    expectedAnnualReturnPercent,
    cashValuePhp,
    investedValuePhp: totalValuePhp - cashValuePhp,
    allocation,
    accountBreakdown,
    contributionHistory,
    insights: buildInsights({
      allocation,
      cashValuePhp,
      totalValuePhp,
      monthlyContributionsPhp,
    }),
  };
}

function calculateWeightedExpectedReturn(
  holdings: InvestmentHolding[],
  usdToPhp: number
): number | null {
  const hasUnratedPositiveHolding = holdings.some((holding) => {
    const value = toPhpValue(holding.current_value, holding.currency, usdToPhp);
    return (
      value > 0 &&
      (holding.expected_annual_return_percent === null ||
        holding.expected_annual_return_percent === undefined)
    );
  });

  if (hasUnratedPositiveHolding) return null;

  const weighted = holdings.reduce(
    (result, holding) => {
      const rate = holding.expected_annual_return_percent;
      if (rate === null || rate === undefined) return result;

      const value = toPhpValue(holding.current_value, holding.currency, usdToPhp);
      return {
        value: result.value + value,
        weightedRate: result.weightedRate + value * rate,
      };
    },
    { value: 0, weightedRate: 0 }
  );

  if (weighted.value <= 0) return null;

  return weighted.weightedRate / weighted.value;
}

export function calculateInvestmentProjection(params: {
  currentValue: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
}): ProjectionResult {
  const monthlyRate = params.annualReturnPercent / 100 / 12;
  const months = params.years * 12;
  let futureValue = params.currentValue;

  for (let month = 0; month < months; month += 1) {
    futureValue = futureValue * (1 + monthlyRate) + params.monthlyContribution;
  }

  const totalContributions = params.monthlyContribution * months;

  return {
    years: params.years,
    futureValue,
    totalContributions,
    estimatedGrowth: futureValue - params.currentValue - totalContributions,
  };
}

export function buildInvestmentProjectionScenarios(params: {
  currentValue: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
}): ProjectionScenario[] {
  const conservativeRate = Math.max(0, params.annualReturnPercent - 2);
  const scenarios = [
    {
      id: 'conservative' as const,
      label: 'Conservative',
      annualReturnPercent: conservativeRate,
    },
    {
      id: 'planned' as const,
      label: 'Planned',
      annualReturnPercent: params.annualReturnPercent,
    },
    {
      id: 'optimistic' as const,
      label: 'Optimistic',
      annualReturnPercent: params.annualReturnPercent + 2,
    },
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    ...calculateInvestmentProjection({
      currentValue: params.currentValue,
      monthlyContribution: params.monthlyContribution,
      annualReturnPercent: scenario.annualReturnPercent,
      years: params.years,
    }),
  }));
}

export function formatAccountType(type: InvestmentAccountType): string {
  const labels: Record<InvestmentAccountType, string> = {
    [InvestmentAccountType.Cash]: 'Cash',
    [InvestmentAccountType.Stocks]: 'Stocks',
    [InvestmentAccountType.Crypto]: 'Crypto',
    [InvestmentAccountType.MP2]: 'MP2',
    [InvestmentAccountType.PSE]: 'PSE/FMETF',
    [InvestmentAccountType.Compound]: 'Compounding',
    [InvestmentAccountType.RealEstate]: 'Real Estate',
    [InvestmentAccountType.Other]: 'Other',
  };

  return labels[type];
}

function toAllocationItems(
  values: Map<string, { label: string; value: number }>,
  total: number
): AllocationItem[] {
  return Array.from(values.entries())
    .map(([key, item]) => ({
      key,
      label: item.label,
      value: item.value,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildInsights(params: {
  allocation: AllocationItem[];
  cashValuePhp: number;
  totalValuePhp: number;
  monthlyContributionsPhp: number;
}): InvestmentInsight[] {
  const insights: InvestmentInsight[] = [];
  const cashRatio =
    params.totalValuePhp > 0 ? (params.cashValuePhp / params.totalValuePhp) * 100 : 0;
  const crypto = params.allocation.find(
    (item) => item.key === InvestmentAccountType.Crypto
  );

  if (cashRatio > 45) {
    insights.push({
      id: 'cash-heavy',
      tone: 'warning',
      title: 'Cash is above target',
      description: `${cashRatio.toFixed(0)}% of tracked assets are in cash. Check whether excess cash should stay liquid or move into your plan.`,
    });
  }

  if (crypto && crypto.percentage > 10) {
    insights.push({
      id: 'crypto-high',
      tone: 'warning',
      title: 'Crypto allocation is elevated',
      description: `${crypto.percentage.toFixed(0)}% is in crypto. Review this against your target allocation before adding more.`,
    });
  }

  if (params.monthlyContributionsPhp <= 0) {
    insights.push({
      id: 'no-monthly-contribution',
      tone: 'neutral',
      title: 'No contribution logged this month',
      description: 'Add a buy or deposit transaction to track progress against your monthly plan.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'on-track',
      tone: 'success',
      title: 'Portfolio looks balanced',
      description: 'Tracked assets and contributions do not show any major drift right now.',
    });
  }

  return insights;
}
