import { AppButton, AppPageHeader } from '@/components/atoms';
import { AppPicker } from '@/components/atoms/app-picker';
import AppTypography from '@/components/atoms/app-typography';
import { useCreateInvestmentAccount } from '@/hooks/investments/use-create-investment-account';
import { useDeleteInvestmentAccount } from '@/hooks/investments/use-delete-investment-account';
import { useInvestmentAccountsLive } from '@/hooks/investments/use-investment-accounts-live';
import { formatAccountType } from '@/lib/investment.utils';
import {
  InvestmentAccountType,
  InvestmentCurrency,
} from '@/repository/investment.db';
import { FC, useRef, useState } from 'react';

const accountTypeOptions = [
  InvestmentAccountType.Stocks,
  InvestmentAccountType.Crypto,
  InvestmentAccountType.PSE,
  InvestmentAccountType.MP2,
  InvestmentAccountType.Cash,
  InvestmentAccountType.Compound,
  InvestmentAccountType.RealEstate,
  InvestmentAccountType.Other,
].map((type) => ({
  label: formatAccountType(type),
  value: type,
}));

const currencyOptions = [
  { label: 'PHP', value: InvestmentCurrency.PHP },
  { label: 'USD', value: InvestmentCurrency.USD },
];

const InvestmentAccounts: FC = () => {
  const accounts = useInvestmentAccountsLive();
  const createAccount = useCreateInvestmentAccount();
  const deleteAccount = useDeleteInvestmentAccount();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentAccountType>(
    InvestmentAccountType.MP2
  );
  const [currency, setCurrency] = useState<InvestmentCurrency>(
    InvestmentCurrency.PHP
  );

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    await createAccount.execute({
      name: trimmedName,
      type,
      currency,
    });
    setName('');
    inputRef.current?.focus();
  };

  const handleDelete = async (id: string, accountName: string) => {
    if (!window.confirm(`Delete "${accountName}"?`)) return;
    await deleteAccount.execute(id);
  };

  return (
    <div className='pb-56'>
      <AppPageHeader title='Xpense' description='Investment Accounts' />

      {!accounts && (
        <AppTypography
          variant='small'
          className='py-8 text-center text-neutral-400'
        >
          Loading...
        </AppTypography>
      )}

      {accounts?.length === 0 && (
        <div className='py-16 text-center'>
          <AppTypography variant='small' className='text-neutral-400'>
            No investment accounts yet.
          </AppTypography>
        </div>
      )}

      <div className='mt-4 flex flex-col gap-2'>
        {accounts?.map((account) => (
          <div
            key={account.id}
            className='rounded-xl bg-neutral-50 px-4 py-3'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <AppTypography
                  variant='body'
                  className='truncate font-medium text-neutral-900'
                >
                  {account.name}
                </AppTypography>
                <AppTypography variant='small' className='text-neutral-500'>
                  {formatAccountType(account.type)} · {account.currency}
                </AppTypography>
              </div>
              <AppButton
                variant='ghost'
                size='sm'
                onClick={() =>
                  account.id && handleDelete(account.id, account.name)
                }
                disabled={deleteAccount.isPending || account.holdingsCount > 0}
                className='text-neutral-400 hover:text-red-500'
                aria-label={`Delete ${account.name}`}
              >
                Delete
              </AppButton>
            </div>
            <div className='mt-2 flex items-center justify-between text-xs text-neutral-400'>
              <span>{account.holdingsCount} holdings</span>
              <span className='tabular-nums'>
                {formatAccountValue(account.currentValue, account.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className='fixed inset-x-0 bottom-0 border-t border-neutral-100 bg-white/80 px-4 pt-3 backdrop-blur-md'
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
        }}
      >
        <div className='grid grid-cols-2 gap-2'>
          <AppPicker
            id='investment-account-type'
            label='Type'
            options={accountTypeOptions}
            value={type}
            onChange={(value) => setType(value as InvestmentAccountType)}
          />
          <AppPicker
            id='investment-account-currency'
            label='Currency'
            options={currencyOptions}
            value={currency}
            onChange={(value) => setCurrency(value as InvestmentCurrency)}
          />
        </div>
        <div className='mt-2 flex gap-2'>
          <input
            ref={inputRef}
            type='text'
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
            placeholder='New account name'
            className='flex-1 rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300'
          />
          <AppButton
            onClick={handleAdd}
            disabled={!name.trim() || createAccount.isPending}
            variant='solid'
            size='md'
          >
            Add
          </AppButton>
        </div>
      </div>
    </div>
  );
};

function formatAccountValue(
  amount: number,
  currency: InvestmentCurrency
): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === InvestmentCurrency.PHP ? 0 : 2,
  }).format(amount);
}

export default InvestmentAccounts;
