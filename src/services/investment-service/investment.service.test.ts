import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/repository';
import { expenseService } from '@/services/expense-service/expense.service';
import {
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentTransactionType,
} from '@/repository/investment.db';
import { investmentService } from './investment.service';

const SIMPLE_MP2_DEPOSIT = {
  accountName: 'MP2',
  accountType: InvestmentAccountType.MP2,
  currency: InvestmentCurrency.PHP,
  transactionType: InvestmentTransactionType.Deposit,
  holdingName: 'MP2',
  symbol: null,
  quantity: null,
  pricePerUnit: null,
  amount: 5000,
  fees: null,
  usdToPhp: null,
  expectedAnnualReturnPercent: 6.5,
  transactionDate: new Date('2026-05-04T00:00:00'),
  notes: 'Monthly contribution',
};

const MARKET_QQQ_BUY = {
  accountName: 'IBKR',
  accountType: InvestmentAccountType.Stocks,
  currency: InvestmentCurrency.USD,
  transactionType: InvestmentTransactionType.Buy,
  holdingName: 'QQQ',
  symbol: 'qqq',
  quantity: 2,
  pricePerUnit: 500,
  amount: 1000,
  fees: 1,
  usdToPhp: 58,
  expectedAnnualReturnPercent: null,
  transactionDate: new Date('2026-05-04T00:00:00'),
  notes: 'Manual market buy',
};

beforeEach(async () => {
  await db.open();
  await clearInvestmentData();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await clearInvestmentData();
});

describe('investmentService.add simple balance tracking', () => {
  it('creates a simple PHP investment without market price records', async () => {
    const result = await investmentService.add(SIMPLE_MP2_DEPOSIT);

    expect(result.error).toBeNull();

    const [account] = await db.investmentAccounts.toArray();
    const [holding] = await db.investmentHoldings.toArray();
    const [transaction] = await db.investmentTransactions.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(account.id).toMatch(/^inv/);
    expect(account.name).toBe('MP2');
    expect(account.type).toBe(InvestmentAccountType.MP2);
    expect(account.currency).toBe(InvestmentCurrency.PHP);

    expect(holding.id).toMatch(/^inv/);
    expect(holding.name).toBe('MP2');
    expect(holding.symbol).toBeNull();
    expect(holding.quantity).toBe(1);
    expect(holding.cost_basis).toBe(5000);
    expect(holding.current_price).toBe(5000);
    expect(holding.current_value).toBe(5000);
    expect(holding.expected_annual_return_percent).toBe(6.5);
    expect(holding.currency).toBe(InvestmentCurrency.PHP);

    expect(transaction.id).toMatch(/^inv/);
    expect(transaction.type).toBe(InvestmentTransactionType.Deposit);
    expect(transaction.amount).toBe(5000);
    expect(transaction.currency).toBe(InvestmentCurrency.PHP);
    expect(transaction.holding_id).toBe(holding.id);
    expect(snapshots).toHaveLength(0);
  });

  it('mirrors a simple investment deposit as a normal expense', async () => {
    const result = await investmentService.add(SIMPLE_MP2_DEPOSIT);

    expect(result.error).toBeNull();

    const expenses = await db.expenses.toArray();
    const categories = await db.categories.toArray();
    const [transaction] = await db.investmentTransactions.toArray();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].title).toBe('Investment: MP2');
    expect(expenses[0].amount).toBe(5000);
    expect(expenses[0].description).toBe('Monthly contribution');
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Investments');
    expect(transaction.expense_id).toBe(expenses[0].id);
  });

  it('reuses the same simple account and holding for repeat deposits', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      amount: 7000,
      expectedAnnualReturnPercent: 7,
      transactionDate: new Date('2026-05-15T00:00:00'),
      notes: 'Second contribution',
    });

    const accounts = await db.investmentAccounts.toArray();
    const holdings = await db.investmentHoldings.toArray();
    const transactions = await db.investmentTransactions.toArray();
    const expenses = await db.expenses.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(accounts).toHaveLength(1);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(1);
    expect(holdings[0].cost_basis).toBe(12000);
    expect(holdings[0].current_price).toBe(12000);
    expect(holdings[0].current_value).toBe(12000);
    expect(holdings[0].expected_annual_return_percent).toBe(7);
    expect(transactions).toHaveLength(2);
    expect(expenses.map((expense) => expense.amount).sort()).toEqual([
      5000,
      7000,
    ]);
    expect(snapshots).toHaveLength(0);
  });

  it('links repeat same-day deposits to separate expense records', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      notes: 'Same amount and date',
    });

    const transactions = await db.investmentTransactions.toArray();
    const expenses = await db.expenses.toArray();
    const expenseIds = transactions.map((transaction) => transaction.expense_id);

    expect(transactions).toHaveLength(2);
    expect(expenses).toHaveLength(2);
    expect(new Set(expenseIds)).toHaveLength(2);
    expect(expenseIds.every(Boolean)).toBe(true);
    expect(
      expenseIds.every((expenseId) =>
        expenses.some((expense) => expense.id === expenseId)
      )
    ).toBe(true);
  });

  it('rolls back account, holding, and expense rows if transaction logging fails', async () => {
    vi.spyOn(db.investmentTransactions, 'add').mockRejectedValueOnce(
      new Error('transaction insert failed')
    );

    const result = await investmentService.add(SIMPLE_MP2_DEPOSIT);

    expect(result.error).toBeInstanceOf(Error);
    expect(await db.investmentAccounts.toArray()).toHaveLength(0);
    expect(await db.investmentHoldings.toArray()).toHaveLength(0);
    expect(await db.investmentTransactions.toArray()).toHaveLength(0);
    expect(await db.expenses.toArray()).toHaveLength(0);
  });

  it('keeps simple investment math simple even if market-only fields are passed', async () => {
    const result = await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      symbol: 'QQQ',
      quantity: 99,
      pricePerUnit: 123,
      fees: 10,
      expectedAnnualReturnPercent: 8,
    });

    expect(result.error).toBeNull();

    const [holding] = await db.investmentHoldings.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(holding.symbol).toBeNull();
    expect(holding.quantity).toBe(1);
    expect(holding.cost_basis).toBe(5010);
    expect(holding.current_price).toBe(5010);
    expect(holding.current_value).toBe(5010);
    expect(holding.expected_annual_return_percent).toBe(8);
    expect(snapshots).toHaveLength(0);
  });

  it('does not create a holding or expense for passive income records', async () => {
    const result = await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      transactionType: InvestmentTransactionType.Interest,
      amount: 25,
      fees: null,
      expectedAnnualReturnPercent: null,
      notes: 'Dividend or interest income',
    });

    expect(result.error).toBeNull();

    const expenses = await db.expenses.toArray();
    const holdings = await db.investmentHoldings.toArray();
    const transactions = await db.investmentTransactions.toArray();

    expect(expenses).toHaveLength(0);
    expect(holdings).toHaveLength(0);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].holding_id).toBeNull();
    expect(transactions[0].expense_id).toBeNull();
  });
});

describe('investmentService.add market tracking', () => {
  it('creates a manual market holding with quantity, price, snapshot, and expense mirror', async () => {
    const result = await investmentService.add(MARKET_QQQ_BUY);

    expect(result.error).toBeNull();

    const [account] = await db.investmentAccounts.toArray();
    const [holding] = await db.investmentHoldings.toArray();
    const [transaction] = await db.investmentTransactions.toArray();
    const [snapshot] = await db.investmentPriceSnapshots.toArray();
    const [expense] = await db.expenses.toArray();

    expect(account.name).toBe('IBKR');
    expect(account.type).toBe(InvestmentAccountType.Stocks);
    expect(account.currency).toBe(InvestmentCurrency.USD);

    expect(holding.name).toBe('QQQ');
    expect(holding.symbol).toBe('QQQ');
    expect(holding.quantity).toBe(2);
    expect(holding.cost_basis).toBe(1001);
    expect(holding.current_price).toBe(500);
    expect(holding.current_value).toBe(1000);
    expect(holding.currency).toBe(InvestmentCurrency.USD);

    expect(transaction.holding_id).toBe(holding.id);
    expect(transaction.quantity).toBe(2);
    expect(transaction.price_per_unit).toBe(500);
    expect(transaction.fees).toBe(1);

    expect(snapshot.holding_id).toBe(holding.id);
    expect(snapshot.symbol).toBe('QQQ');
    expect(snapshot.price).toBe(500);

    expect(expense.title).toBe('Investment: QQQ');
    expect(expense.amount).toBe(58058);
    expect(transaction.expense_id).toBe(expense.id);
  });

  it('reuses the same market account and symbol holding for repeat buys', async () => {
    await investmentService.add(MARKET_QQQ_BUY);
    await investmentService.add({
      ...MARKET_QQQ_BUY,
      quantity: 1,
      pricePerUnit: 600,
      amount: 600,
      fees: 0,
      transactionDate: new Date('2026-05-15T00:00:00'),
    });

    const accounts = await db.investmentAccounts.toArray();
    const holdings = await db.investmentHoldings.toArray();
    const transactions = await db.investmentTransactions.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(accounts).toHaveLength(1);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(3);
    expect(holdings[0].cost_basis).toBe(1601);
    expect(holdings[0].current_price).toBe(600);
    expect(holdings[0].current_value).toBe(1800);
    expect(transactions).toHaveLength(2);
    expect(snapshots).toHaveLength(2);
  });
});

describe('investmentService holding updates', () => {
  it('updates simple holding balance without rewriting the original transaction or expense', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();
    const [originalTransaction] = await db.investmentTransactions.toArray();

    const result = await investmentService.updateSimpleBalance({
      holdingId: holding.id ?? '',
      currentValue: 15000,
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const expenses = await db.expenses.toArray();
    const transactions = await db.investmentTransactions.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(updatedHolding.quantity).toBe(1);
    expect(updatedHolding.cost_basis).toBe(5000);
    expect(updatedHolding.current_price).toBe(15000);
    expect(updatedHolding.current_value).toBe(15000);
    expect(updatedHolding.expected_annual_return_percent).toBe(6.5);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({
      id: originalExpense.id,
      amount: 5000,
      title: 'Investment: MP2',
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      id: originalTransaction.id,
      amount: 5000,
    });
    expect(snapshots).toHaveLength(0);
  });

  it('logs a simple withdrawal as money moved out, not an unrealized loss or expense', async () => {
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      accountName: 'Emergency Fund',
      accountType: InvestmentAccountType.Cash,
      holdingName: 'Emergency Fund',
      amount: 700000,
      expectedAnnualReturnPercent: null,
    });
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();

    const result = await investmentService.withdraw({
      holdingId: holding.id ?? '',
      amount: 100000,
      transactionDate: new Date('2026-05-20T00:00:00'),
      notes: 'Moved to checking',
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const expenses = await db.expenses.toArray();
    const transactions = await db.investmentTransactions.toArray();

    expect(updatedHolding.current_value).toBe(600000);
    expect(updatedHolding.cost_basis).toBe(600000);
    expect(updatedHolding.current_value - updatedHolding.cost_basis).toBe(0);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({
      id: originalExpense.id,
      amount: 700000,
    });
    expect(transactions).toHaveLength(2);
    expect(
      transactions.some(
        (transaction) =>
          transaction.type === InvestmentTransactionType.Deposit &&
          transaction.amount === 700000
      )
    ).toBe(true);
    expect(transactions.find((transaction) => transaction.type === InvestmentTransactionType.Withdrawal)).toMatchObject({
      type: InvestmentTransactionType.Withdrawal,
      amount: 100000,
      expense_id: null,
      notes: 'Moved to checking',
    });
  });

  it('rejects simple withdrawals that are zero or above the current balance', async () => {
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      accountName: 'Emergency Fund',
      accountType: InvestmentAccountType.Cash,
      holdingName: 'Emergency Fund',
      amount: 700000,
      expectedAnnualReturnPercent: null,
    });
    const [holding] = await db.investmentHoldings.toArray();

    const zeroResult = await investmentService.withdraw({
      holdingId: holding.id ?? '',
      amount: 0,
      transactionDate: new Date('2026-05-20T00:00:00'),
    });
    const tooMuchResult = await investmentService.withdraw({
      holdingId: holding.id ?? '',
      amount: 800000,
      transactionDate: new Date('2026-05-20T00:00:00'),
    });

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const transactions = await db.investmentTransactions.toArray();
    const expenses = await db.expenses.toArray();

    expect(zeroResult.error).toBeInstanceOf(Error);
    expect(tooMuchResult.error).toBeInstanceOf(Error);
    expect(updatedHolding.current_value).toBe(700000);
    expect(updatedHolding.cost_basis).toBe(700000);
    expect(transactions).toHaveLength(1);
    expect(expenses).toHaveLength(1);
  });

  it('reduces cost basis proportionally when withdrawing from an appreciated simple holding', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    const [holding] = await db.investmentHoldings.toArray();
    await investmentService.updateSimpleBalance({
      holdingId: holding.id ?? '',
      currentValue: 15000,
    });

    const result = await investmentService.withdraw({
      holdingId: holding.id ?? '',
      amount: 3000,
      transactionDate: new Date('2026-05-20T00:00:00'),
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();

    expect(updatedHolding.current_value).toBe(12000);
    expect(updatedHolding.cost_basis).toBeCloseTo(4000);
  });

  it('blocks withdrawals, deletes, and balance decreases while a holding is timelocked', async () => {
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      timelockUntil: new Date('2031-05-04T10:30:00'),
    });
    const [holding] = await db.investmentHoldings.toArray();

    const withdrawResult = await investmentService.withdraw({
      holdingId: holding.id ?? '',
      amount: 1000,
      transactionDate: new Date('2026-05-20T00:00:00'),
    });
    const balanceDecreaseResult = await investmentService.updateSimpleBalance({
      holdingId: holding.id ?? '',
      currentValue: 4000,
    });
    const deleteResult = await investmentService.deleteHolding(holding.id ?? '');

    const [updatedHolding] = await db.investmentHoldings.toArray();

    expect(withdrawResult.error).toBeInstanceOf(Error);
    expect(balanceDecreaseResult.error).toBeInstanceOf(Error);
    expect(deleteResult).toBeInstanceOf(Error);
    expect(updatedHolding.current_value).toBe(5000);
    expect(await db.investmentTransactions.toArray()).toHaveLength(1);
    expect(await db.expenses.toArray()).toHaveLength(1);
  });

  it('updates simple holding details without changing balance, transaction, or expense', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();

    const result = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      name: 'Pag-IBIG MP2',
      expectedAnnualReturnPercent: 7.25,
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const [expense] = await db.expenses.toArray();
    const [transaction] = await db.investmentTransactions.toArray();

    expect(updatedHolding.name).toBe('Pag-IBIG MP2');
    expect(updatedHolding.current_value).toBe(5000);
    expect(updatedHolding.cost_basis).toBe(5000);
    expect(updatedHolding.expected_annual_return_percent).toBe(7.25);
    expect(expense).toMatchObject({
      id: originalExpense.id,
      amount: 5000,
      title: 'Investment: MP2',
    });
    expect(transaction.amount).toBe(5000);
  });

  it('stores and updates a holding timelock without changing transaction or expense records', async () => {
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      timelockUntil: new Date('2031-05-04T10:30:00'),
    });
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();

    expect(holding.timelock_until).toEqual(new Date('2031-05-04T10:30:00'));

    const result = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      name: 'MP2 Locked',
      timelockUntil: new Date('2032-01-15T08:00:00'),
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const [expense] = await db.expenses.toArray();
    const [transaction] = await db.investmentTransactions.toArray();

    expect(updatedHolding.name).toBe('MP2 Locked');
    expect(updatedHolding.timelock_until).toEqual(
      new Date('2032-01-15T08:00:00')
    );
    expect(expense).toMatchObject({
      id: originalExpense.id,
      amount: 5000,
    });
    expect(transaction.amount).toBe(5000);
  });

  it('does not allow a locked holding to shorten or clear its timelock', async () => {
    await investmentService.add({
      ...SIMPLE_MP2_DEPOSIT,
      timelockUntil: new Date('2031-05-04T10:30:00'),
    });
    const [holding] = await db.investmentHoldings.toArray();

    const clearResult = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      timelockUntil: null,
    });
    const shortenResult = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      timelockUntil: new Date('2030-01-01T00:00:00'),
    });
    const extendResult = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      timelockUntil: new Date('2032-01-01T00:00:00'),
    });

    const [updatedHolding] = await db.investmentHoldings.toArray();

    expect(clearResult.error).toBeInstanceOf(Error);
    expect(shortenResult.error).toBeInstanceOf(Error);
    expect(extendResult.error).toBeNull();
    expect(updatedHolding.timelock_until).toEqual(
      new Date('2032-01-01T00:00:00')
    );
  });

  it('updates a market holding price without rewriting the original transaction or expense', async () => {
    await investmentService.add(MARKET_QQQ_BUY);
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();
    const [originalTransaction] = await db.investmentTransactions.toArray();

    const result = await investmentService.updateMarketPrice({
      holdingId: holding.id ?? '',
      currentPrice: 540,
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const expenses = await db.expenses.toArray();
    const transactions = await db.investmentTransactions.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(updatedHolding.name).toBe('QQQ');
    expect(updatedHolding.symbol).toBe('QQQ');
    expect(updatedHolding.quantity).toBe(2);
    expect(updatedHolding.cost_basis).toBe(1001);
    expect(updatedHolding.current_price).toBe(540);
    expect(updatedHolding.current_value).toBe(1080);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({
      id: originalExpense.id,
      amount: 58058,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      id: originalTransaction.id,
      amount: 1000,
      quantity: 2,
      price_per_unit: 500,
    });
    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((snapshot) => snapshot.price).sort()).toEqual([
      500,
      540,
    ]);
  });

  it('does not change monthly spending when a market price moves', async () => {
    await investmentService.add(MARKET_QQQ_BUY);
    const [holding] = await db.investmentHoldings.toArray();
    const beforeSpent = await expenseService.spentThisMonth(
      new Date('2026-05-10T00:00:00')
    );

    await investmentService.updateMarketPrice({
      holdingId: holding.id ?? '',
      currentPrice: 650,
    });

    const afterSpent = await expenseService.spentThisMonth(
      new Date('2026-05-10T00:00:00')
    );

    expect(afterSpent).toBe(beforeSpent);
    expect(afterSpent).toBe(58058);
  });

  it('updates market holding details without changing price, transaction, or expense', async () => {
    await investmentService.add(MARKET_QQQ_BUY);
    const [holding] = await db.investmentHoldings.toArray();
    const [originalExpense] = await db.expenses.toArray();

    const result = await investmentService.updateHoldingDetails({
      holdingId: holding.id ?? '',
      name: 'Invesco QQQ',
      symbol: ' qqqm ',
    });

    expect(result.error).toBeNull();

    const [updatedHolding] = await db.investmentHoldings.toArray();
    const [expense] = await db.expenses.toArray();
    const [transaction] = await db.investmentTransactions.toArray();
    const snapshots = await db.investmentPriceSnapshots.toArray();

    expect(updatedHolding.name).toBe('Invesco QQQ');
    expect(updatedHolding.symbol).toBe('QQQM');
    expect(updatedHolding.quantity).toBe(2);
    expect(updatedHolding.current_price).toBe(500);
    expect(updatedHolding.current_value).toBe(1000);
    expect(expense).toMatchObject({
      id: originalExpense.id,
      title: 'Investment: QQQ',
      amount: 58058,
    });
    expect(transaction.symbol).toBe('QQQ');
    expect(transaction.amount).toBe(1000);
    expect(snapshots).toHaveLength(1);
  });

  it('returns an error when updating an unknown holding', async () => {
    const result = await investmentService.updateSimpleBalance({
      holdingId: 'missing',
      currentValue: 1000,
    });

    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('investmentService account management', () => {
  it('creates a manual investment account with a valid Dexie Cloud ID', async () => {
    const result = await investmentService.createAccount({
      name: 'COL Financial',
      type: InvestmentAccountType.PSE,
      currency: InvestmentCurrency.PHP,
    });

    expect(result.error).toBeNull();

    const [account] = await db.investmentAccounts.toArray();
    expect(account.id).toMatch(/^inv/);
    expect(account.name).toBe('COL Financial');
    expect(account.type).toBe(InvestmentAccountType.PSE);
    expect(account.currency).toBe(InvestmentCurrency.PHP);
  });

  it('does not delete accounts that still have holdings', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    const [account] = await db.investmentAccounts.toArray();

    const result = await investmentService.deleteAccount(account.id ?? '');

    expect(result).toBeInstanceOf(Error);
    expect(await db.investmentAccounts.toArray()).toHaveLength(1);
  });

  it('deletes an empty investment account', async () => {
    const created = await investmentService.createAccount({
      name: 'IBKR',
      type: InvestmentAccountType.Stocks,
      currency: InvestmentCurrency.USD,
    });

    const result = await investmentService.deleteAccount(created.account?.id);

    expect(result).toBeNull();
    expect(await db.investmentAccounts.toArray()).toHaveLength(0);
  });
});

describe('investmentService.deleteHolding', () => {
  it('deletes a simple holding with linked transaction and expense', async () => {
    await investmentService.add(SIMPLE_MP2_DEPOSIT);
    const [holding] = await db.investmentHoldings.toArray();

    const result = await investmentService.deleteHolding(holding.id ?? '');

    expect(result).toBeNull();
    expect(await db.investmentHoldings.toArray()).toHaveLength(0);
    expect(await db.investmentTransactions.toArray()).toHaveLength(0);
    expect(await db.investmentPriceSnapshots.toArray()).toHaveLength(0);
    expect(await db.expenses.toArray()).toHaveLength(0);
    expect(await db.investmentAccounts.toArray()).toHaveLength(1);
  });

  it('deletes a market holding with linked transactions, snapshots, and expenses', async () => {
    await investmentService.add(MARKET_QQQ_BUY);
    await investmentService.add({
      ...MARKET_QQQ_BUY,
      quantity: 1,
      pricePerUnit: 600,
      amount: 600,
      fees: 0,
      transactionDate: new Date('2026-05-15T00:00:00'),
    });
    const [holding] = await db.investmentHoldings.toArray();

    const result = await investmentService.deleteHolding(holding.id ?? '');

    expect(result).toBeNull();
    expect(await db.investmentHoldings.toArray()).toHaveLength(0);
    expect(await db.investmentTransactions.toArray()).toHaveLength(0);
    expect(await db.investmentPriceSnapshots.toArray()).toHaveLength(0);
    expect(await db.expenses.toArray()).toHaveLength(0);
    expect(await db.investmentAccounts.toArray()).toHaveLength(1);
  });

  it('returns an error when deleting an unknown holding', async () => {
    const result = await investmentService.deleteHolding('missing');

    expect(result).toBeInstanceOf(Error);
  });
});

async function clearInvestmentData() {
  await Promise.all([
    db.investmentPriceSnapshots.clear(),
    db.investmentTransactions.clear(),
    db.investmentHoldings.clear(),
    db.investmentAccounts.clear(),
    db.expenses.clear(),
    db.categories.clear(),
  ]);
}
