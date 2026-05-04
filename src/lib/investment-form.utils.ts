import { PickerOption } from '@/components/atoms/app-picker';
import {
  InvestmentAccount,
  InvestmentAccountType,
  InvestmentCurrency,
} from '@/repository';

export type ResolvedInvestmentAccountSelection = {
  accountName: string;
  accountType: InvestmentAccountType;
  currency: InvestmentCurrency;
  selectedAccountId: string | null;
  isExistingAccount: boolean;
};

export function getInvestmentAccountOptions(
  accounts: InvestmentAccount[]
): PickerOption[] {
  return accounts.map((account) => ({
    label: account.name,
    value: account.id ?? account.name,
  }));
}

export function resolveInvestmentAccountSelection(params: {
  accounts: InvestmentAccount[];
  accountValue: string;
  fallbackType: InvestmentAccountType;
  fallbackCurrency: InvestmentCurrency;
}): ResolvedInvestmentAccountSelection {
  const selectedAccount =
    params.accounts.find((account) => account.id === params.accountValue) ??
    null;

  if (selectedAccount) {
    return {
      accountName: selectedAccount.name,
      accountType: selectedAccount.type,
      currency: selectedAccount.currency,
      selectedAccountId: selectedAccount.id ?? null,
      isExistingAccount: true,
    };
  }

  return {
    accountName: params.accountValue.trim(),
    accountType: params.fallbackType,
    currency: params.fallbackCurrency,
    selectedAccountId: null,
    isExistingAccount: false,
  };
}

export function isMarketInvestmentType(type: InvestmentAccountType): boolean {
  return [
    InvestmentAccountType.Stocks,
    InvestmentAccountType.Crypto,
    InvestmentAccountType.PSE,
  ].includes(type);
}
