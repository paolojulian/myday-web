import { DBError } from '@/config/errors.constants';
import { handleError } from '@/lib/handle-error.utils';
import {
  calculateHoldingValue,
  getTransactionCashImpact,
} from '@/lib/investment.utils';
import {
  db,
  InvestmentAccount,
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '@/repository';
import { categoryService } from '@/services/category-service/category.service';

export type AddInvestmentParams = {
  accountName: string;
  accountType: InvestmentAccountType;
  currency: InvestmentCurrency;
  transactionType: InvestmentTransactionType;
  holdingName: string;
  symbol?: string | null;
  quantity?: number | null;
  pricePerUnit?: number | null;
  amount: number;
  fees?: number | null;
  usdToPhp?: number | null;
  expectedAnnualReturnPercent?: number | null;
  transactionDate: Date;
  notes?: string | null;
};

export type CreateInvestmentAccountParams = {
  name: string;
  type: InvestmentAccountType;
  currency: InvestmentCurrency;
};

export type UpdateInvestmentHoldingDetailsParams = {
  holdingId: string;
  name?: string | null;
  symbol?: string | null;
  expectedAnnualReturnPercent?: number | null;
};

export type UpdateInvestmentMarketPriceParams = {
  holdingId: string;
  currentPrice: number;
};

export type UpdateInvestmentSimpleBalanceParams = {
  holdingId: string;
  currentValue: number;
};

const INVESTMENT_CATEGORY_NAME = 'Investments';
const generateInvestmentId = () => `inv${crypto.randomUUID()}`;
const generateExpenseId = () => `exp${crypto.randomUUID()}`;

class InvestmentService {
  public async add(
    params: AddInvestmentParams
  ): Promise<{ error: Error | null; transaction?: InvestmentTransaction }> {
    const dateNow = new Date();

    try {
      const account = await this.ensureAccount(params, dateNow);
      const holding = await this.upsertHolding(account, params, dateNow);
      const expenseId = await this.createExpenseMirror(params, holding);
      const transaction: InvestmentTransaction = {
        id: generateInvestmentId(),
        account_id: account.id ?? '',
        holding_id: holding?.id ?? null,
        expense_id: expenseId,
        type: params.transactionType,
        transaction_date: params.transactionDate,
        symbol: normalizeSymbol(params.symbol),
        quantity: params.quantity ?? null,
        price_per_unit: params.pricePerUnit ?? null,
        amount: params.amount,
        fees: params.fees ?? null,
        currency: params.currency,
        notes: params.notes ?? null,
        created_at: dateNow,
        updated_at: dateNow,
      };

      await db.investmentTransactions.add(transaction);

      if (
        holding?.id &&
        isMarketAccountType(account.type) &&
        params.pricePerUnit &&
        params.pricePerUnit > 0
      ) {
        await db.investmentPriceSnapshots.add({
          id: generateInvestmentId(),
          holding_id: holding.id,
          symbol: normalizeSymbol(params.symbol),
          price: params.pricePerUnit,
          currency: params.currency,
          source: 'manual',
          captured_at: dateNow,
        });
      }

      return { error: null, transaction };
    } catch (e) {
      return {
        error: handleError(e, new DBError('Unable to add investment')),
      };
    }
  }

  public async listAccounts(): Promise<InvestmentAccount[]> {
    return db.investmentAccounts.orderBy('name').toArray();
  }

  public async listHoldings(): Promise<InvestmentHolding[]> {
    return db.investmentHoldings.orderBy('updated_at').reverse().toArray();
  }

  public async listTransactions(): Promise<InvestmentTransaction[]> {
    return db.investmentTransactions
      .orderBy('transaction_date')
      .reverse()
      .toArray();
  }

  public async createAccount(
    params: CreateInvestmentAccountParams
  ): Promise<{ error: Error | null; account?: InvestmentAccount }> {
    const dateNow = new Date();
    const name = params.name.trim();

    if (!name) {
      return { error: new DBError('Investment account name is required') };
    }

    try {
      const existing = await db.investmentAccounts
        .filter(
          (account) =>
            account.name.toLowerCase() === name.toLowerCase() &&
            account.type === params.type &&
            account.currency === params.currency
        )
        .first();

      if (existing) {
        return { error: null, account: existing };
      }

      const account: InvestmentAccount = {
        id: generateInvestmentId(),
        name,
        type: params.type,
        currency: params.currency,
        target_allocation_percent: null,
        created_at: dateNow,
        updated_at: dateNow,
      };

      await db.investmentAccounts.add(account);
      return { error: null, account };
    } catch (e) {
      return {
        error: handleError(e, new DBError('Unable to create investment account')),
      };
    }
  }

  public async deleteAccount(
    accountId: InvestmentAccount['id']
  ): Promise<Error | null> {
    if (!accountId) {
      return new DBError('Investment account ID is required');
    }

    try {
      const holdingsCount = await db.investmentHoldings
        .where('account_id')
        .equals(accountId)
        .count();

      if (holdingsCount > 0) {
        return new DBError('Delete holdings before deleting this account');
      }

      await db.investmentAccounts.delete(accountId);
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to delete investment account'));
    }
  }

  public async updateHoldingDetails(
    params: UpdateInvestmentHoldingDetailsParams
  ): Promise<{ error: Error | null; holding?: InvestmentHolding }> {
    const dateNow = new Date();

    try {
      const holding = await db.investmentHoldings.get(params.holdingId);
      if (!holding) {
        return { error: new DBError('Investment holding not found') };
      }

      const account = await db.investmentAccounts.get(holding.account_id);
      if (!account) {
        return { error: new DBError('Investment account not found') };
      }

      const isMarket = isMarketAccountType(account.type);
      const nextName = params.name?.trim() || holding.name;
      const nextSymbol = isMarket
        ? normalizeSymbol(params.symbol ?? holding.symbol)
        : null;
      const nextExpectedAnnualReturnPercent = isMarket
        ? holding.expected_annual_return_percent ?? null
        : params.expectedAnnualReturnPercent ??
          holding.expected_annual_return_percent ??
          null;

      const updatedHolding: InvestmentHolding = {
        ...holding,
        name: nextName,
        symbol: nextSymbol,
        expected_annual_return_percent: nextExpectedAnnualReturnPercent,
        updated_at: dateNow,
      };

      await db.investmentHoldings.update(params.holdingId, {
        name: updatedHolding.name,
        symbol: updatedHolding.symbol,
        expected_annual_return_percent:
          updatedHolding.expected_annual_return_percent,
        updated_at: updatedHolding.updated_at,
      });

      return { error: null, holding: updatedHolding };
    } catch (e) {
      return {
        error: handleError(
          e,
          new DBError('Unable to update investment holding details')
        ),
      };
    }
  }

  public async updateMarketPrice(
    params: UpdateInvestmentMarketPriceParams
  ): Promise<{ error: Error | null; holding?: InvestmentHolding }> {
    const dateNow = new Date();

    try {
      const holding = await db.investmentHoldings.get(params.holdingId);
      if (!holding) {
        return { error: new DBError('Investment holding not found') };
      }

      const account = await db.investmentAccounts.get(holding.account_id);
      if (!account || !isMarketAccountType(account.type)) {
        return { error: new DBError('Investment market holding not found') };
      }

      const currentPrice = Math.max(0, params.currentPrice);
      const updatedHolding: InvestmentHolding = {
        ...holding,
        current_price: currentPrice,
        current_value: calculateHoldingValue(holding.quantity, currentPrice),
        price_source: 'manual',
        price_updated_at: dateNow,
        updated_at: dateNow,
      };

      await db.transaction(
        'rw',
        db.investmentHoldings,
        db.investmentPriceSnapshots,
        async () => {
          await db.investmentHoldings.update(params.holdingId, {
            current_price: updatedHolding.current_price,
            current_value: updatedHolding.current_value,
            price_source: updatedHolding.price_source,
            price_updated_at: updatedHolding.price_updated_at,
            updated_at: updatedHolding.updated_at,
          });

          if (updatedHolding.current_price > 0) {
            await db.investmentPriceSnapshots.add({
              id: generateInvestmentId(),
              holding_id: updatedHolding.id ?? '',
              symbol: updatedHolding.symbol,
              price: updatedHolding.current_price,
              currency: updatedHolding.currency,
              source: 'manual',
              captured_at: dateNow,
            });
          }
        }
      );

      return { error: null, holding: updatedHolding };
    } catch (e) {
      return {
        error: handleError(e, new DBError('Unable to update investment price')),
      };
    }
  }

  public async updateSimpleBalance(
    params: UpdateInvestmentSimpleBalanceParams
  ): Promise<{ error: Error | null; holding?: InvestmentHolding }> {
    const dateNow = new Date();

    try {
      const holding = await db.investmentHoldings.get(params.holdingId);
      if (!holding) {
        return { error: new DBError('Investment holding not found') };
      }

      const account = await db.investmentAccounts.get(holding.account_id);
      if (!account || isMarketAccountType(account.type)) {
        return { error: new DBError('Investment balance holding not found') };
      }

      const currentValue = Math.max(0, params.currentValue);
      const updatedHolding: InvestmentHolding = {
        ...holding,
        quantity: 1,
        current_price: currentValue,
        current_value: currentValue,
        price_source: 'manual',
        price_updated_at: dateNow,
        updated_at: dateNow,
      };

      await db.investmentHoldings.update(params.holdingId, {
        quantity: updatedHolding.quantity,
        current_price: updatedHolding.current_price,
        current_value: updatedHolding.current_value,
        price_source: updatedHolding.price_source,
        price_updated_at: updatedHolding.price_updated_at,
        updated_at: updatedHolding.updated_at,
      });

      return { error: null, holding: updatedHolding };
    } catch (e) {
      return {
        error: handleError(e, new DBError('Unable to update investment balance')),
      };
    }
  }

  public async deleteHolding(
    holdingId: InvestmentHolding['id']
  ): Promise<Error | null> {
    if (!holdingId) {
      return new DBError('Investment holding ID is required');
    }

    try {
      const holding = await db.investmentHoldings.get(holdingId);
      if (!holding) {
        return new DBError('Investment holding not found');
      }

      await db.transaction(
        'rw',
        db.investmentHoldings,
        db.investmentTransactions,
        db.investmentPriceSnapshots,
        db.expenses,
        async () => {
          const transactions = await db.investmentTransactions
            .where('holding_id')
            .equals(holdingId)
            .toArray();
          const expenseIds = transactions
            .map((transaction) => transaction.expense_id)
            .filter((id): id is string => !!id);

          await Promise.all([
            db.investmentHoldings.delete(holdingId),
            db.investmentTransactions
              .where('holding_id')
              .equals(holdingId)
              .delete(),
            db.investmentPriceSnapshots
              .where('holding_id')
              .equals(holdingId)
              .delete(),
            expenseIds.length > 0
              ? db.expenses.bulkDelete(expenseIds)
              : Promise.resolve(),
          ]);
        }
      );

      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to delete investment holding'));
    }
  }

  private async ensureAccount(
    params: AddInvestmentParams,
    dateNow: Date
  ): Promise<InvestmentAccount> {
    const trimmedName = params.accountName.trim();
    const existing = await db.investmentAccounts
      .filter(
        (account) =>
          account.name.toLowerCase() === trimmedName.toLowerCase() &&
          account.type === params.accountType &&
          account.currency === params.currency
      )
      .first();

    if (existing) return existing;

    const account: InvestmentAccount = {
      id: generateInvestmentId(),
      name: trimmedName,
      type: params.accountType,
      currency: params.currency,
      target_allocation_percent: null,
      created_at: dateNow,
      updated_at: dateNow,
    };

    await db.investmentAccounts.add(account);
    return account;
  }

  private async upsertHolding(
    account: InvestmentAccount,
    params: AddInvestmentParams,
    dateNow: Date
  ): Promise<InvestmentHolding | null> {
    const normalizedSymbol = normalizeSymbol(params.symbol);
    const holdingName = params.holdingName.trim() || params.accountName.trim();
    const shouldMatchBySymbol =
      isMarketAccountType(account.type) && !!normalizedSymbol;
    const existing = await db.investmentHoldings
      .filter(
        (holding) =>
          holding.account_id === account.id &&
          (shouldMatchBySymbol
            ? holding.symbol === normalizedSymbol
            : holding.name.toLowerCase() === holdingName.toLowerCase())
      )
      .first();

    if (!shouldMutateHolding(params.transactionType)) {
      return existing ?? null;
    }

    if (!isMarketAccountType(account.type)) {
      const cashImpact = getTransactionCashImpact({
        type: params.transactionType,
        amount: params.amount,
        fees: params.fees,
      });
      const nextValue = Math.max(0, (existing?.current_value ?? 0) + cashImpact);
      const nextCostBasis = Math.max(0, (existing?.cost_basis ?? 0) + cashImpact);

      if (existing) {
        await db.investmentHoldings.update(existing.id ?? '', {
          quantity: 1,
          cost_basis: nextCostBasis,
          current_price: nextValue,
          current_value: nextValue,
          expected_annual_return_percent:
            params.expectedAnnualReturnPercent ??
            existing.expected_annual_return_percent ??
            null,
          price_source: 'manual',
          price_updated_at: dateNow,
          updated_at: dateNow,
        });

        return {
          ...existing,
          quantity: 1,
          cost_basis: nextCostBasis,
          current_price: nextValue,
          current_value: nextValue,
          expected_annual_return_percent:
            params.expectedAnnualReturnPercent ??
            existing.expected_annual_return_percent ??
            null,
          price_source: 'manual',
          price_updated_at: dateNow,
          updated_at: dateNow,
        };
      }

      const holding: InvestmentHolding = {
        id: generateInvestmentId(),
        account_id: account.id ?? '',
        name: holdingName,
        symbol: null,
        quantity: 1,
        cost_basis: nextCostBasis,
        current_price: nextValue,
        current_value: nextValue,
        expected_annual_return_percent: params.expectedAnnualReturnPercent ?? null,
        currency: params.currency,
        price_source: 'manual',
        price_updated_at: dateNow,
        created_at: dateNow,
        updated_at: dateNow,
      };

      await db.investmentHoldings.add(holding);
      return holding;
    }

    const currentPrice =
      params.pricePerUnit && params.pricePerUnit > 0
        ? params.pricePerUnit
        : existing?.current_price ?? params.amount;
    const quantityDelta = params.quantity ?? (currentPrice > 0 ? params.amount / currentPrice : 0);
    const cashImpact = getTransactionCashImpact({
      type: params.transactionType,
      amount: params.amount,
      fees: params.fees,
    });

    if (existing) {
      const nextQuantity = calculateNextQuantity(
        existing.quantity,
        quantityDelta,
        params.transactionType
      );
      const nextCostBasis = Math.max(
        0,
        existing.cost_basis + calculateCostBasisDelta(cashImpact, params.transactionType)
      );
      const currentValue = calculateHoldingValue(nextQuantity, currentPrice);

      await db.investmentHoldings.update(existing.id ?? '', {
        quantity: nextQuantity,
        cost_basis: nextCostBasis,
        current_price: currentPrice,
        current_value: currentValue,
        expected_annual_return_percent:
          params.expectedAnnualReturnPercent ??
          existing.expected_annual_return_percent ??
          null,
        price_source: 'manual',
        price_updated_at: dateNow,
        updated_at: dateNow,
      });

      return {
        ...existing,
        quantity: nextQuantity,
        cost_basis: nextCostBasis,
        current_price: currentPrice,
        current_value: currentValue,
        expected_annual_return_percent:
          params.expectedAnnualReturnPercent ??
          existing.expected_annual_return_percent ??
          null,
        price_source: 'manual',
        price_updated_at: dateNow,
        updated_at: dateNow,
      };
    }

    const quantity = shouldTrackQuantity(params.transactionType)
      ? quantityDelta
      : 1;
    const costBasis = Math.max(0, calculateCostBasisDelta(cashImpact, params.transactionType));
    const holding: InvestmentHolding = {
      id: generateInvestmentId(),
      account_id: account.id ?? '',
      name: holdingName,
      symbol: normalizedSymbol,
      quantity,
      cost_basis: costBasis,
      current_price: currentPrice,
      current_value: shouldTrackQuantity(params.transactionType)
        ? calculateHoldingValue(quantity, currentPrice)
        : params.amount,
      expected_annual_return_percent: params.expectedAnnualReturnPercent ?? null,
      currency: params.currency,
      price_source: 'manual',
      price_updated_at: dateNow,
      created_at: dateNow,
      updated_at: dateNow,
    };

    await db.investmentHoldings.add(holding);
    return holding;
  }

  private async createExpenseMirror(
    params: AddInvestmentParams,
    holding: InvestmentHolding | null
  ): Promise<string | null> {
    const cashImpact = getTransactionCashImpact({
      type: params.transactionType,
      amount: params.amount,
      fees: params.fees,
    });

    if (cashImpact <= 0) return null;

    const categoryId = await this.ensureInvestmentCategory();
    const title = `Investment: ${holding?.symbol || holding?.name || params.holdingName}`;
    const expenseAmount = Math.abs(toExpensePhpAmount(cashImpact, params));
    const expenseId = generateExpenseId();
    const dateNow = new Date();

    await db.expenses.add({
      id: expenseId,
      title,
      amount: expenseAmount,
      transaction_date: params.transactionDate,
      description: params.notes,
      category_id: categoryId,
      recurrence: null,
      recurrence_id: null,
      created_at: dateNow,
      updated_at: dateNow,
    });

    return expenseId;
  }

  private async ensureInvestmentCategory(): Promise<string | null> {
    const existing = await db.categories
      .filter(
        (category) =>
          category.name.toLowerCase() === INVESTMENT_CATEGORY_NAME.toLowerCase()
      )
      .first();

    if (existing?.id) return existing.id;

    const { error, category } = await categoryService.add({
      name: INVESTMENT_CATEGORY_NAME,
    });
    if (error) throw error;

    return category?.id ?? null;
  }
}

function normalizeSymbol(symbol?: string | null): string | null {
  const trimmed = symbol?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function shouldTrackQuantity(type: InvestmentTransactionType): boolean {
  return [
    InvestmentTransactionType.Buy,
    InvestmentTransactionType.Sell,
    InvestmentTransactionType.Deposit,
    InvestmentTransactionType.Withdrawal,
    InvestmentTransactionType.PriceUpdate,
  ].includes(type);
}

function shouldMutateHolding(type: InvestmentTransactionType): boolean {
  return [
    InvestmentTransactionType.Buy,
    InvestmentTransactionType.Sell,
    InvestmentTransactionType.Deposit,
    InvestmentTransactionType.Withdrawal,
    InvestmentTransactionType.PriceUpdate,
  ].includes(type);
}

function isMarketAccountType(type: InvestmentAccountType): boolean {
  return [
    InvestmentAccountType.Stocks,
    InvestmentAccountType.Crypto,
    InvestmentAccountType.PSE,
  ].includes(type);
}

function calculateNextQuantity(
  currentQuantity: number,
  quantityDelta: number,
  type: InvestmentTransactionType
): number {
  if (
    type === InvestmentTransactionType.Sell ||
    type === InvestmentTransactionType.Withdrawal
  ) {
    return Math.max(0, currentQuantity - quantityDelta);
  }

  if (
    type === InvestmentTransactionType.Buy ||
    type === InvestmentTransactionType.Deposit
  ) {
    return currentQuantity + quantityDelta;
  }

  return currentQuantity;
}

function calculateCostBasisDelta(
  cashImpact: number,
  type: InvestmentTransactionType
): number {
  if (
    type === InvestmentTransactionType.Buy ||
    type === InvestmentTransactionType.Deposit
  ) {
    return cashImpact;
  }

  if (
    type === InvestmentTransactionType.Sell ||
    type === InvestmentTransactionType.Withdrawal
  ) {
    return cashImpact;
  }

  return 0;
}

export const investmentService = new InvestmentService();

function toExpensePhpAmount(
  cashImpact: number,
  params: Pick<AddInvestmentParams, 'currency' | 'usdToPhp'>
): number {
  if (params.currency === InvestmentCurrency.PHP) return cashImpact;
  return cashImpact * (params.usdToPhp || 58);
}
