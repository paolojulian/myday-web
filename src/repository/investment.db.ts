export enum InvestmentAccountType {
  Cash = 'cash',
  Stocks = 'stocks',
  Crypto = 'crypto',
  MP2 = 'mp2',
  PSE = 'pse',
  Compound = 'compound',
  RealEstate = 'real_estate',
  Other = 'other',
}

export enum InvestmentCurrency {
  PHP = 'PHP',
  USD = 'USD',
}

export enum InvestmentTransactionType {
  Buy = 'buy',
  Sell = 'sell',
  Deposit = 'deposit',
  Withdrawal = 'withdrawal',
  Dividend = 'dividend',
  Interest = 'interest',
  Fee = 'fee',
  PriceUpdate = 'price_update',
}

export type InvestmentAccount = {
  id?: string;
  name: string;
  type: InvestmentAccountType;
  currency: InvestmentCurrency;
  target_allocation_percent?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type InvestmentHolding = {
  id?: string;
  account_id: string;
  name: string;
  symbol?: string | null;
  quantity: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  expected_annual_return_percent?: number | null;
  timelock_until?: Date | null;
  currency: InvestmentCurrency;
  price_source: 'manual' | 'api';
  price_updated_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type InvestmentTransaction = {
  id?: string;
  account_id: string;
  holding_id?: string | null;
  expense_id?: string | null;
  type: InvestmentTransactionType;
  transaction_date: Date;
  symbol?: string | null;
  quantity?: number | null;
  price_per_unit?: number | null;
  amount: number;
  fees?: number | null;
  currency: InvestmentCurrency;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type InvestmentGoal = {
  id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date | null;
  monthly_contribution?: number | null;
  category: InvestmentAccountType;
  priority: 'low' | 'medium' | 'high';
  created_at: Date;
  updated_at: Date;
};

export type InvestmentPriceSnapshot = {
  id?: string;
  holding_id: string;
  symbol?: string | null;
  price: number;
  currency: InvestmentCurrency;
  source: 'manual' | 'api';
  captured_at: Date;
};
