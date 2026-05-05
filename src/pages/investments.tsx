import { AppPageHeader } from '@/components/atoms';
import { AppButton } from '@/components/atoms/app-button';
import { AppPicker } from '@/components/atoms/app-picker';
import AppTextInput from '@/components/atoms/app-text-input';
import AppTypography from '@/components/atoms/app-typography';
import { useCreateInvestment } from '@/hooks/investments/use-create-investment';
import { useDeleteInvestmentHolding } from '@/hooks/investments/use-delete-investment-holding';
import { useInvestmentsLive } from '@/hooks/investments/use-investments-live';
import { useUpdateInvestmentHolding } from '@/hooks/investments/use-update-investment-holding';
import { toCurrency } from '@/lib/currency.utils';
import {
  getInvestmentAccountOptions,
  isMarketInvestmentType,
  resolveInvestmentAccountSelection,
} from '@/lib/investment-form.utils';
import {
  buildInvestmentProjectionScenarios,
  calculateInvestmentProjection,
  calculateReturnPercent,
  formatAccountType,
  toPhpValue,
} from '@/lib/investment.utils';
import {
  getSavedProjectionMonthlyAdd,
  saveProjectionMonthlyAdd,
} from '@/lib/investment-settings.utils';
import {
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentHolding,
  InvestmentTransactionType,
} from '@/repository';
import cn from '@/utils/cn';
import dayjs from 'dayjs';
import { FormEvent, useMemo, useState } from 'react';

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

const timelockOptions = [
  { label: 'No timelock', value: 'none' },
  { label: 'Lock until date', value: 'locked' },
];

const chartColors = [
  '#111827',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
];

type InvestmentFormState = {
  accountValue: string;
  accountType: InvestmentAccountType;
  currency: InvestmentCurrency;
  symbol: string;
  quantity: string;
  pricePerUnit: string;
  amount: string;
  fees: string;
  usdToPhp: string;
  expectedAnnualReturnPercent: string;
  timelockMode: TimelockMode;
  timelockUntil: string;
  transactionDate: string;
  notes: string;
};

const initialFormState: InvestmentFormState = {
  accountValue: '',
  accountType: InvestmentAccountType.MP2,
  currency: InvestmentCurrency.PHP,
  symbol: '',
  quantity: '',
  pricePerUnit: '',
  amount: '',
  fees: '',
  usdToPhp: '58',
  expectedAnnualReturnPercent: '',
  timelockMode: 'none',
  timelockUntil: '',
  transactionDate: dayjs().format('YYYY-MM-DD'),
  notes: '',
};

const horizonOptions = [5, 10, 15, 20];
type HoldingActionMode = 'actions' | 'details' | 'price' | 'withdraw' | 'balance';
type TimelockMode = 'none' | 'locked';

const Investments = () => {
  const investmentData = useInvestmentsLive();
  const createInvestment = useCreateInvestment();
  const updateHolding = useUpdateInvestmentHolding();
  const deleteHolding = useDeleteInvestmentHolding();
  const [isAdding, setIsAdding] = useState(false);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [editActionMode, setEditActionMode] =
    useState<HoldingActionMode>('actions');
  const [editForm, setEditForm] = useState({
    name: '',
    symbol: '',
    quantity: '',
    currentPrice: '',
    currentValue: '',
    withdrawalAmount: '',
    withdrawalDate: dayjs().format('YYYY-MM-DD'),
    expectedAnnualReturnPercent: '',
    timelockMode: 'none' as TimelockMode,
    timelockUntil: '',
  });
  const [form, setForm] = useState<InvestmentFormState>(initialFormState);
  const [projectionYears, setProjectionYears] = useState(10);
  const [projectionContribution, setProjectionContribution] = useState(() =>
    getSavedProjectionMonthlyAdd(window.localStorage)
  );

  const overview = investmentData?.overview;
  const accounts = investmentData?.accounts;
  const holdings = investmentData?.holdings ?? [];
  const accountById = useMemo(
    () => new Map((accounts ?? []).map((account) => [account.id, account])),
    [accounts]
  );
  const accountOptions = useMemo(
    () => getInvestmentAccountOptions(accounts ?? []),
    [accounts]
  );
  const resolvedAccount = useMemo(
    () =>
      resolveInvestmentAccountSelection({
        accounts: accounts ?? [],
        accountValue: form.accountValue,
        fallbackType: form.accountType,
        fallbackCurrency: form.currency,
      }),
    [accounts, form.accountType, form.accountValue, form.currency]
  );
  const isExistingAccount = resolvedAccount.isExistingAccount;
  const isMarketType = isMarketInvestmentType(resolvedAccount.accountType);
  const shouldShowFxRate = isMarketType && resolvedAccount.currency === InvestmentCurrency.USD;
  const canSubmit = isMarketType
    ? !!resolvedAccount.accountName &&
      !!form.symbol.trim() &&
      toNumber(form.quantity) > 0 &&
      toNumber(form.pricePerUnit) > 0 &&
      hasValidTimelock(form.timelockMode, form.timelockUntil)
    : !!resolvedAccount.accountName &&
      toNumber(form.amount) > 0 &&
      hasValidTimelock(form.timelockMode, form.timelockUntil);
  const projectionRate = overview?.expectedAnnualReturnPercent ?? 7;

  const projection = useMemo(() => {
    return calculateInvestmentProjection({
      currentValue: overview?.totalValuePhp ?? 0,
      monthlyContribution: toNumber(projectionContribution),
      annualReturnPercent: projectionRate,
      years: projectionYears,
    });
  }, [
    overview?.totalValuePhp,
    projectionContribution,
    projectionRate,
    projectionYears,
  ]);
  const projectionScenarios = useMemo(() => {
    return buildInvestmentProjectionScenarios({
      currentValue: overview?.totalValuePhp ?? 0,
      monthlyContribution: toNumber(projectionContribution),
      annualReturnPercent: projectionRate,
      years: projectionYears,
    });
  }, [
    overview?.totalValuePhp,
    projectionContribution,
    projectionRate,
    projectionYears,
  ]);

  const allocationGradient = useMemo(() => {
    if (!overview || overview.allocation.length === 0) {
      return '#f5f5f5';
    }

    let cursor = 0;
    const parts = overview.allocation.map((item, index) => {
      const start = cursor;
      cursor += item.percentage;
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }, [overview]);

  const handleChange = <Key extends keyof InvestmentFormState>(
    key: Key,
    value: InvestmentFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleAccountChange = (value: string) => {
    const selectedAccount = accounts?.find((account) => account.id === value);
    setForm((current) => ({
      ...current,
      accountValue: value,
      accountType: selectedAccount?.type ?? current.accountType,
      currency: selectedAccount?.currency ?? current.currency,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = toOptionalNumber(form.quantity);
    const pricePerUnit = toOptionalNumber(form.pricePerUnit);
    const amount = isMarketType
      ? (quantity ?? 0) * (pricePerUnit ?? 0)
      : toNumber(form.amount);
    const holdingName = isMarketType
      ? form.symbol.trim().toUpperCase()
      : resolvedAccount.accountName;

    await createInvestment.execute({
      accountName: resolvedAccount.accountName,
      accountType: resolvedAccount.accountType,
      currency: resolvedAccount.currency,
      transactionType: isMarketType
        ? InvestmentTransactionType.Buy
        : InvestmentTransactionType.Deposit,
      holdingName,
      symbol: isMarketType ? form.symbol : null,
      quantity: isMarketType ? quantity : null,
      pricePerUnit: isMarketType ? pricePerUnit : null,
      amount,
      fees: isMarketType ? toOptionalNumber(form.fees) : null,
      usdToPhp: shouldShowFxRate ? toOptionalNumber(form.usdToPhp) : null,
      expectedAnnualReturnPercent: isMarketType
        ? null
        : toOptionalNumber(form.expectedAnnualReturnPercent),
      timelockUntil:
        form.timelockMode === 'locked'
          ? toOptionalDate(form.timelockUntil)
          : null,
      transactionDate: dayjs(form.transactionDate).toDate(),
      notes: form.notes || null,
    });

    setForm(initialFormState);
    setIsAdding(false);
  };

  const startEditHolding = (holding: InvestmentHolding) => {
    setIsAdding(false);
    setEditingHoldingId(holding.id ?? null);
    setEditActionMode('actions');
    setEditForm({
      name: holding.name,
      symbol: holding.symbol ?? '',
      quantity: String(holding.quantity),
      currentPrice: String(holding.current_price),
      currentValue: String(holding.current_value),
      withdrawalAmount: '',
      withdrawalDate: dayjs().format('YYYY-MM-DD'),
      expectedAnnualReturnPercent:
        holding.expected_annual_return_percent !== null &&
        holding.expected_annual_return_percent !== undefined
          ? String(holding.expected_annual_return_percent)
          : '',
      timelockMode: holding.timelock_until ? 'locked' : 'none',
      timelockUntil: holding.timelock_until
        ? dayjs(holding.timelock_until).format('YYYY-MM-DD')
        : '',
    });
  };

  const cancelEditHolding = () => {
    setEditingHoldingId(null);
    setEditActionMode('actions');
  };

  const closeEditHolding = () => {
    setEditingHoldingId(null);
    setEditActionMode('actions');
  };

  const submitHoldingDetails = async (
    event: FormEvent<HTMLFormElement>,
    holding: InvestmentHolding,
    isMarket: boolean
  ) => {
    event.preventDefault();

    await updateHolding.updateDetails({
      holdingId: holding.id ?? '',
      name: editForm.name,
      symbol: isMarket ? editForm.symbol : null,
      expectedAnnualReturnPercent: isMarket
        ? null
        : toOptionalNumber(editForm.expectedAnnualReturnPercent),
      timelockUntil:
        editForm.timelockMode === 'locked'
          ? toOptionalDate(editForm.timelockUntil)
          : null,
    });
    closeEditHolding();
  };

  const submitMarketPrice = async (
    event: FormEvent<HTMLFormElement>,
    holding: InvestmentHolding
  ) => {
    event.preventDefault();

    await updateHolding.updateMarketPrice({
      holdingId: holding.id ?? '',
      currentPrice: toNumber(editForm.currentPrice),
    });
    closeEditHolding();
  };

  const submitSimpleBalance = async (
    event: FormEvent<HTMLFormElement>,
    holding: InvestmentHolding
  ) => {
    event.preventDefault();

    await updateHolding.updateSimpleBalance({
      holdingId: holding.id ?? '',
      currentValue: toNumber(editForm.currentValue),
    });
    closeEditHolding();
  };

  const submitSimpleWithdrawal = async (
    event: FormEvent<HTMLFormElement>,
    holding: InvestmentHolding
  ) => {
    event.preventDefault();

    await updateHolding.withdraw({
      holdingId: holding.id ?? '',
      amount: toNumber(editForm.withdrawalAmount),
      transactionDate: dayjs(editForm.withdrawalDate).toDate(),
      notes: 'Investment withdrawal',
    });
    closeEditHolding();
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!window.confirm('Delete this investment holding and its linked expenses?')) {
      return;
    }

    await deleteHolding.execute(holdingId);
    setEditingHoldingId(null);
  };

  const handleProjectionContributionChange = (value: string) => {
    const nextValue = String(value || '');
    setProjectionContribution(nextValue);
    saveProjectionMonthlyAdd(window.localStorage, nextValue);
  };

  return (
    <div className='pb-44'>
      <section id='investments-header'>
        <AppPageHeader title='Xpense' description='Investments' />
      </section>

      <div className='mt-4 flex items-center justify-between gap-3'>
        <div>
          <AppTypography variant='body' className='font-semibold text-neutral-900'>
            Portfolio
          </AppTypography>
          <AppTypography variant='small' className='text-neutral-400'>
            Balances and manual market buys
          </AppTypography>
        </div>
        <AppButton
          type='button'
          size='sm'
          onClick={() => setIsAdding((value) => !value)}
        >
          {isAdding ? 'Close' : 'Add'}
        </AppButton>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className='mt-4 rounded-lg border border-neutral-100 bg-white p-4 shadow-sm shadow-neutral-900/5'
        >
          <div className='grid grid-cols-1 gap-3'>
            <AppPicker
              id='investment-account-name'
              label='Account'
              placeholder='IBKR, MP2, Seabank'
              options={accountOptions}
              value={form.accountValue}
              onChange={handleAccountChange}
              allowCustom
              searchPlaceholder='Search or create account'
            />

            {!isExistingAccount && (
              <AppPicker
                id='investment-account-type'
                label='Type'
                options={accountTypeOptions}
                value={form.accountType}
                onChange={(value) =>
                  handleChange('accountType', value as InvestmentAccountType)
                }
              />
            )}

            {isMarketType && (
              <>
                {!isExistingAccount && (
                  <AppPicker
                    id='investment-currency'
                    label='Currency'
                    options={currencyOptions}
                    value={form.currency}
                    onChange={(value) =>
                      handleChange('currency', value as InvestmentCurrency)
                    }
                  />
                )}

                <AppTextInput
                  id='investment-symbol'
                  label='Investment'
                  placeholder='QQQ, BTC'
                  value={form.symbol}
                  onChangeText={(value) =>
                    handleChange('symbol', String(value || ''))
                  }
                  required
                />

                <div className='grid grid-cols-2 gap-3'>
                  <AppTextInput
                    id='investment-quantity'
                    label='Shares / units'
                    inputMode='decimal'
                    placeholder='0'
                    value={form.quantity}
                    onChangeText={(value) =>
                      handleChange('quantity', String(value || ''))
                    }
                    required
                  />
                  <AppTextInput
                    id='investment-price'
                    label='Buy price'
                    inputMode='decimal'
                    placeholder='0'
                    value={form.pricePerUnit}
                    onChangeText={(value) =>
                      handleChange('pricePerUnit', String(value || ''))
                    }
                    required
                  />
                </div>

                <div
                  className={cn(
                    'grid gap-3',
                    shouldShowFxRate ? 'grid-cols-2' : 'grid-cols-1'
                  )}
                >
                  <AppTextInput
                    id='investment-fees'
                    label='Fees'
                    inputMode='decimal'
                    placeholder='0'
                    value={form.fees}
                    onChangeText={(value) =>
                      handleChange('fees', String(value || ''))
                    }
                  />
                  {shouldShowFxRate && (
                    <AppTextInput
                      id='investment-fx'
                      label='USD to PHP'
                      inputMode='decimal'
                      placeholder='58'
                      value={form.usdToPhp}
                      onChangeText={(value) =>
                        handleChange('usdToPhp', String(value || ''))
                      }
                    />
                  )}
                </div>
              </>
            )}

            {!isMarketType && (
              <>
                <AppTextInput
                  id='investment-amount'
                  label='Balance / contribution'
                  inputMode='decimal'
                  placeholder='0'
                  value={form.amount}
                  onChangeText={(value) =>
                    handleChange('amount', String(value || ''))
                  }
                  required
                />

                <AppTextInput
                  id='investment-expected-rate'
                  label={
                    resolvedAccount.accountType === InvestmentAccountType.MP2
                      ? 'Expected dividend %'
                      : 'Expected annual %'
                  }
                  inputMode='decimal'
                  placeholder='Optional'
                  value={form.expectedAnnualReturnPercent}
                  onChangeText={(value) =>
                    handleChange(
                      'expectedAnnualReturnPercent',
                      String(value || '')
                    )
                  }
                />
              </>
            )}

            <AppTextInput
              id='investment-date'
              label='Date'
              type='date'
              value={form.transactionDate}
              onChangeText={(value) =>
                handleChange('transactionDate', String(value || ''))
              }
              required
            />

            <AppPicker
              id='investment-timelock-mode'
              label='Timelock'
              options={timelockOptions}
              value={form.timelockMode}
              onChange={(value) =>
                handleChange('timelockMode', value as TimelockMode)
              }
            />

            {form.timelockMode === 'locked' && (
              <TimelockDateInput
                id='investment-timelock-until'
                label='Timelock date'
                value={form.timelockUntil}
                onChangeText={(value) =>
                  handleChange('timelockUntil', String(value || ''))
                }
              />
            )}

            <AppTextInput
              id='investment-notes'
              label='Notes'
              placeholder='Monthly DCA'
              value={form.notes}
              onChangeText={(value) => handleChange('notes', String(value || ''))}
            />
          </div>

          <div className='mt-4 flex gap-2'>
            <AppButton
              type='button'
              variant='outlined'
              className='flex-1'
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type='submit'
              className='flex-1'
              disabled={createInvestment.isPending || !canSubmit}
            >
              Add Investment
            </AppButton>
          </div>
        </form>
      )}

      <section className='mt-4 grid grid-cols-2 gap-3'>
        <MetricCard
          label='Portfolio Value'
          value={toCurrency(overview?.totalValuePhp ?? 0)}
        />
        <MetricCard
          label='Unrealized'
          value={toCurrency(overview?.unrealizedGainPhp ?? 0)}
          tone={(overview?.unrealizedGainPhp ?? 0) >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          label='Monthly Added'
          value={toCurrency(overview?.monthlyContributionsPhp ?? 0)}
        />
        <MetricCard
          label='Return'
          value={`${(overview?.returnPercent ?? 0).toFixed(1)}%`}
          tone={(overview?.returnPercent ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </section>

      <section className='mt-4 rounded-lg border border-neutral-100 bg-white p-4'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <AppTypography variant='body' className='font-semibold text-neutral-900'>
              Allocation
            </AppTypography>
            <AppTypography variant='small' className='text-neutral-400'>
              Based on latest saved prices
            </AppTypography>
          </div>
          <div
            className='h-24 w-24 rounded-full'
            style={{ background: allocationGradient }}
          />
        </div>

        <div className='mt-4 flex flex-col gap-2'>
          {overview?.allocation.length ? (
            overview.allocation.map((item, index) => (
              <ChartRow
                key={item.key}
                label={item.label}
                value={toCurrency(item.value)}
                percentage={item.percentage}
                color={chartColors[index % chartColors.length]}
              />
            ))
          ) : (
            <EmptyCopy text='Add an investment to see your allocation.' />
          )}
        </div>
      </section>

      <section className='mt-4 rounded-lg border border-neutral-100 bg-white p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <AppTypography variant='body' className='font-semibold text-neutral-900'>
              Future Value
            </AppTypography>
            <AppTypography variant='small' className='text-neutral-400'>
              Starting from today, with monthly additions.
            </AppTypography>
          </div>
          <div className='text-right'>
            <AppTypography variant='small' className='text-neutral-400'>
              Base rate
            </AppTypography>
            <p className='text-sm font-bold tabular-nums text-neutral-900'>
              {projectionRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-4 gap-2'>
          {horizonOptions.map((years) => (
            <button
              key={years}
              type='button'
              onClick={() => setProjectionYears(years)}
              className={cn(
                'h-10 rounded-lg border text-sm font-semibold transition-all active:scale-95',
                projectionYears === years
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600'
              )}
            >
              {years}y
            </button>
          ))}
        </div>

        <div className='mt-3 grid grid-cols-2 gap-3'>
          <AppTextInput
            id='projection-contribution'
            label='Monthly add'
            inputMode='decimal'
            value={projectionContribution}
            onChangeText={(value) =>
              handleProjectionContributionChange(String(value || ''))
            }
          />
          <div className='rounded bg-neutral-50 px-4 py-3'>
            <AppTypography variant='small' className='text-neutral-400'>
              Assumption
            </AppTypography>
            <p className='mt-1 text-sm font-semibold text-neutral-900'>
              {overview?.expectedAnnualReturnPercent
                ? 'Uses tracked rates'
                : 'Uses 7% default'}
            </p>
          </div>
        </div>

        <div className='mt-4 rounded-lg bg-neutral-950 p-4 text-white'>
          <AppTypography variant='small' className='text-neutral-400'>
            Planned value in {projection.years} years
          </AppTypography>
          <p className='mt-1 text-3xl font-bold tabular-nums'>
            {toCurrency(projection.futureValue)}
          </p>
          <div className='mt-3 grid grid-cols-2 gap-3'>
            <div>
              <AppTypography variant='small' className='text-neutral-400'>
                New contributions
              </AppTypography>
              <p className='text-sm font-semibold tabular-nums'>
                {toCurrency(projection.totalContributions)}
              </p>
            </div>
            <div>
              <AppTypography variant='small' className='text-neutral-400'>
                Estimated growth
              </AppTypography>
              <p className='text-sm font-semibold tabular-nums'>
                {toCurrency(projection.estimatedGrowth)}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-3 flex flex-col gap-2'>
          {projectionScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2',
                {
                  'bg-neutral-50': scenario.id !== 'planned',
                  'bg-blue-50': scenario.id === 'planned',
                }
              )}
            >
              <div>
                <AppTypography variant='small' className='font-semibold text-neutral-900'>
                  {scenario.label}
                </AppTypography>
                <AppTypography variant='small' className='text-neutral-400'>
                  {scenario.annualReturnPercent.toFixed(1)}% / yr
                </AppTypography>
              </div>
              <p className='text-sm font-bold tabular-nums text-neutral-900'>
                {toCurrency(scenario.futureValue)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className='mt-4 rounded-lg border border-neutral-100 bg-white p-4'>
        <AppTypography variant='body' className='font-semibold text-neutral-900'>
          Holdings
        </AppTypography>

        <div className='mt-3 flex flex-col gap-2'>
          {holdings.length ? (
            holdings.map((holding) => {
              const account = accountById.get(holding.account_id);
              const isMarket = account ? isMarketInvestmentType(account.type) : false;
              return (
                <div key={holding.id}>
                  <HoldingRow
                    holding={holding}
                    accountName={account?.name ?? 'Investment'}
                    isMarket={isMarket}
                    onEdit={() => startEditHolding(holding)}
                  />
                  {editingHoldingId === holding.id && (
                    <HoldingEditForm
                      holding={holding}
                      isMarket={isMarket}
                      mode={editActionMode}
                      form={editForm}
                      isPending={updateHolding.isPending || deleteHolding.isPending}
                      onModeChange={setEditActionMode}
                      onChange={(key, value) =>
                        setEditForm((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      onCancel={cancelEditHolding}
                      onDelete={() => handleDeleteHolding(holding.id ?? '')}
                      onSubmitDetails={(event) =>
                        submitHoldingDetails(event, holding, isMarket)
                      }
                      onSubmitMarketPrice={(event) =>
                        submitMarketPrice(event, holding)
                      }
                      onSubmitSimpleBalance={(event) =>
                        submitSimpleBalance(event, holding)
                      }
                      onSubmitSimpleWithdrawal={(event) =>
                        submitSimpleWithdrawal(event, holding)
                      }
                    />
                  )}
                </div>
              );
            })
          ) : (
            <EmptyCopy text='No investments tracked yet.' />
          )}
        </div>
      </section>

      <section className='mt-4 rounded-lg border border-neutral-100 bg-white p-4'>
        <AppTypography variant='body' className='font-semibold text-neutral-900'>
          Insights
        </AppTypography>
        <div className='mt-3 flex flex-col gap-2'>
          {overview?.insights.map((insight) => (
            <div
              key={insight.id}
              className={cn('rounded-lg border p-3', {
                'border-emerald-100 bg-emerald-50': insight.tone === 'success',
                'border-amber-100 bg-amber-50': insight.tone === 'warning',
                'border-red-100 bg-red-50': insight.tone === 'danger',
                'border-neutral-100 bg-neutral-50': insight.tone === 'neutral',
              })}
            >
              <AppTypography variant='body' className='font-semibold text-neutral-900'>
                {insight.title}
              </AppTypography>
              <AppTypography variant='small' className='text-neutral-500'>
                {insight.description}
              </AppTypography>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

type MetricCardProps = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
};

const MetricCard = ({ label, value, tone }: MetricCardProps) => (
  <div className='rounded-lg border border-neutral-100 bg-white p-4 shadow-sm shadow-neutral-900/5'>
    <AppTypography variant='small' className='text-neutral-400'>
      {label}
    </AppTypography>
    <p
      className={cn('mt-1 text-xl font-bold tabular-nums text-neutral-900', {
        'text-emerald-600': tone === 'positive',
        'text-red-600': tone === 'negative',
      })}
    >
      {value}
    </p>
  </div>
);

type ChartRowProps = {
  label: string;
  value: string;
  percentage: number;
  color: string;
};

const ChartRow = ({ label, value, percentage, color }: ChartRowProps) => (
  <div>
    <div className='flex items-center justify-between gap-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <span
          className='h-2.5 w-2.5 rounded-full'
          style={{ backgroundColor: color }}
        />
        <AppTypography variant='small' className='truncate text-neutral-600'>
          {label}
        </AppTypography>
      </div>
      <AppTypography variant='small' className='text-neutral-900'>
        {value} · {percentage.toFixed(0)}%
      </AppTypography>
    </div>
    <div className='mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100'>
      <div
        className='h-full rounded-full'
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

type HoldingRowProps = {
  holding: InvestmentHolding;
  accountName: string;
  isMarket: boolean;
  onEdit: () => void;
};

const HoldingRow = ({
  holding,
  accountName,
  isMarket,
  onEdit,
}: HoldingRowProps) => {
  const currentValuePhp = toPhpValue(holding.current_value, holding.currency);
  const costBasisPhp = toPhpValue(holding.cost_basis, holding.currency);
  const gain = currentValuePhp - costBasisPhp;
  const returnPercent = calculateReturnPercent(currentValuePhp, costBasisPhp);
  const timelockUntil = holding.timelock_until
    ? dayjs(holding.timelock_until)
    : null;
  const isLocked = timelockUntil ? timelockUntil.isAfter(dayjs()) : false;

  return (
    <div className='rounded-lg bg-neutral-50 p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <AppTypography variant='body' className='truncate font-semibold text-neutral-900'>
            {holding.symbol || holding.name}
          </AppTypography>
          <AppTypography variant='small' className='truncate text-neutral-400'>
            {accountName} · {holding.currency}
          </AppTypography>
        </div>
        <div className='text-right'>
          <p className='text-sm font-bold tabular-nums text-neutral-900'>
            {toCurrency(currentValuePhp)}
          </p>
          <p
            className={cn('text-xs font-semibold tabular-nums', {
              'text-emerald-600': gain >= 0,
              'text-red-600': gain < 0,
            })}
          >
            {toCurrency(gain)} · {returnPercent.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className='mt-2 flex items-center justify-between gap-3 text-xs text-neutral-400'>
        <div className='min-w-0'>
          <span className='block truncate'>
            {isMarket
              ? `${holding.quantity.toLocaleString()} units`
              : holding.expected_annual_return_percent !== null &&
                  holding.expected_annual_return_percent !== undefined
                ? `Expected ${holding.expected_annual_return_percent.toFixed(1)}% / yr`
                : 'Balance tracked manually'}
          </span>
          {timelockUntil && (
            <span
              className={cn('block truncate font-semibold', {
                'text-amber-600': isLocked,
                'text-neutral-400': !isLocked,
              })}
            >
              {isLocked ? 'Locked until' : 'Unlocked'}{' '}
              {timelockUntil.format('MMM D, YYYY')}
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span>Updated {dayjs(holding.price_updated_at).format('MMM D')}</span>
          <button
            type='button'
            onClick={onEdit}
            className='font-semibold text-neutral-900 active:scale-95'
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

type HoldingEditFormState = {
  name: string;
  symbol: string;
  quantity: string;
  currentPrice: string;
  currentValue: string;
  withdrawalAmount: string;
  withdrawalDate: string;
  expectedAnnualReturnPercent: string;
  timelockMode: TimelockMode;
  timelockUntil: string;
};

type HoldingEditFormProps = {
  holding: InvestmentHolding;
  isMarket: boolean;
  mode: HoldingActionMode;
  form: HoldingEditFormState;
  isPending: boolean;
  onModeChange: (mode: HoldingActionMode) => void;
  onChange: (key: keyof HoldingEditFormState, value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmitDetails: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitMarketPrice: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSimpleBalance: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSimpleWithdrawal: (event: FormEvent<HTMLFormElement>) => void;
};

const HoldingEditForm = ({
  holding,
  isMarket,
  mode,
  form,
  isPending,
  onModeChange,
  onChange,
  onCancel,
  onDelete,
  onSubmitDetails,
  onSubmitMarketPrice,
  onSubmitSimpleBalance,
  onSubmitSimpleWithdrawal,
}: HoldingEditFormProps) => {
  const isLocked = isHoldingTimelocked(holding);

  return (
    <div className='mt-2 rounded-lg border border-neutral-200 bg-white p-3'>
      {mode === 'actions' && (
        <div className='grid grid-cols-2 gap-2'>
          <AppButton
            type='button'
            size='sm'
            variant='outlined'
            onClick={() => onModeChange('details')}
          >
            Details
          </AppButton>
          <AppButton
            type='button'
            size='sm'
            variant='outlined'
            onClick={() => onModeChange(isMarket ? 'price' : 'withdraw')}
          >
            {isMarket ? 'Price' : 'Withdraw'}
          </AppButton>
          {!isMarket && (
            <AppButton
              type='button'
              size='sm'
              variant='outlined'
              onClick={() => onModeChange('balance')}
            >
              Correct
            </AppButton>
          )}
          <AppButton
            type='button'
            variant='danger'
            size='sm'
            onClick={onDelete}
            disabled={isPending || isLocked}
          >
            Delete
          </AppButton>
          <AppButton
            type='button'
            variant='outlined'
            size='sm'
            className='col-span-2'
            onClick={onCancel}
          >
            Cancel
          </AppButton>
        </div>
      )}

      {mode === 'details' && (
        <form onSubmit={onSubmitDetails} className='grid grid-cols-1 gap-3'>
      <AppTextInput
        id={`edit-holding-name-${holding.id}`}
        label='Name'
        value={form.name}
        onChangeText={(value) => onChange('name', String(value || ''))}
        required
      />

      {isMarket ? (
        <>
          <AppTextInput
            id={`edit-holding-symbol-${holding.id}`}
            label='Investment'
            value={form.symbol}
            onChangeText={(value) => onChange('symbol', String(value || ''))}
            required
          />
        </>
      ) : (
        <AppTextInput
          id={`edit-holding-rate-${holding.id}`}
          label='Expected annual %'
          inputMode='decimal'
          placeholder='Optional'
          value={form.expectedAnnualReturnPercent}
          onChangeText={(value) =>
            onChange('expectedAnnualReturnPercent', String(value || ''))
          }
        />
      )}

      {isLocked ? (
        <TimelockDateInput
          id={`edit-holding-timelock-${holding.id}`}
          label='Extend timelock date'
          value={form.timelockUntil}
          onChangeText={(value) =>
            onChange('timelockUntil', String(value || ''))
          }
        />
      ) : (
        <>
          <AppPicker
            id={`edit-holding-timelock-mode-${holding.id}`}
            label='Timelock'
            options={timelockOptions}
            value={form.timelockMode}
            onChange={(value) => onChange('timelockMode', value)}
          />
          {form.timelockMode === 'locked' && (
            <TimelockDateInput
              id={`edit-holding-timelock-${holding.id}`}
              label='Timelock date'
              value={form.timelockUntil}
              onChangeText={(value) =>
                onChange('timelockUntil', String(value || ''))
              }
            />
          )}
        </>
      )}

      <AppButton
        type='submit'
        size='sm'
        disabled={
          isPending ||
          !form.name.trim() ||
          !hasValidTimelock(form.timelockMode, form.timelockUntil)
        }
      >
        Save Details
      </AppButton>
      <AppButton
        type='button'
        variant='outlined'
        size='sm'
        onClick={() => onModeChange('actions')}
      >
        Back
      </AppButton>
    </form>
      )}

      {mode === 'price' && isMarket && (
      <form onSubmit={onSubmitMarketPrice} className='mt-3 grid grid-cols-1 gap-3'>
        <AppTextInput
          id={`edit-holding-price-${holding.id}`}
          label='Current price'
          inputMode='decimal'
          value={form.currentPrice}
          onChangeText={(value) =>
            onChange('currentPrice', String(value || ''))
          }
          required
        />
        <AppButton
          type='submit'
          size='sm'
          disabled={isPending || toNumber(form.currentPrice) <= 0}
        >
          Update Price
        </AppButton>
        <AppButton
          type='button'
          variant='outlined'
          size='sm'
          onClick={() => onModeChange('actions')}
        >
          Back
        </AppButton>
      </form>
      )}

      {mode === 'withdraw' && !isMarket && (
        <form onSubmit={onSubmitSimpleWithdrawal} className='mt-3 grid grid-cols-1 gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            <AppTextInput
              id={`edit-holding-withdrawal-${holding.id}`}
              label='Withdraw'
              inputMode='decimal'
              value={form.withdrawalAmount}
              onChangeText={(value) =>
                onChange('withdrawalAmount', String(value || ''))
              }
              required
            />
            <AppTextInput
              id={`edit-holding-withdrawal-date-${holding.id}`}
              label='Date'
              type='date'
              value={form.withdrawalDate}
              onChangeText={(value) =>
                onChange('withdrawalDate', String(value || ''))
              }
              required
            />
          </div>
          <AppButton
            type='submit'
            size='sm'
            disabled={
              isPending ||
              isLocked ||
              toNumber(form.withdrawalAmount) <= 0 ||
              toNumber(form.withdrawalAmount) > holding.current_value
            }
        >
          Log Withdrawal
        </AppButton>
          <AppButton
            type='button'
            variant='outlined'
            size='sm'
            onClick={() => onModeChange('actions')}
          >
            Back
          </AppButton>
      </form>
      )}

      {mode === 'balance' && !isMarket && (
        <form onSubmit={onSubmitSimpleBalance} className='mt-3 grid grid-cols-1 gap-3'>
          <AppTextInput
            id={`edit-holding-value-${holding.id}`}
            label='Correct balance'
            inputMode='decimal'
            value={form.currentValue}
            onChangeText={(value) =>
              onChange('currentValue', String(value || ''))
            }
            required
          />
          <AppButton
            type='submit'
            size='sm'
            disabled={
              isPending ||
              toNumber(form.currentValue) <= 0 ||
              (isLocked && toNumber(form.currentValue) < holding.current_value)
            }
          >
            Save Balance Correction
          </AppButton>
          <AppButton
            type='button'
            variant='outlined'
            size='sm'
            onClick={() => onModeChange('actions')}
          >
            Back
          </AppButton>
        </form>
      )}
    </div>
  );
};

const EmptyCopy = ({ text }: { text: string }) => (
  <div className='rounded-lg bg-neutral-50 p-4 text-center'>
    <AppTypography variant='small' className='text-neutral-400'>
      {text}
    </AppTypography>
  </div>
);

type TimelockDateInputProps = {
  id: string;
  label: string;
  value: string;
  onChangeText: (value?: string | number) => void;
};

const TimelockDateInput = ({
  id,
  label,
  value,
  onChangeText,
}: TimelockDateInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <AppTextInput
      id={id}
      label={label}
      type={isFocused || !!value ? 'date' : 'text'}
      value={value}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChangeText={onChangeText}
    />
  );
};

function toNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  return toNumber(value);
}

function toOptionalDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.startOf('day').toDate() : null;
}

function isHoldingTimelocked(holding: InvestmentHolding): boolean {
  if (!holding.timelock_until) return false;
  return dayjs(holding.timelock_until).isAfter(dayjs());
}

function hasValidTimelock(mode: TimelockMode, value: string): boolean {
  return mode === 'none' || !!value.trim();
}

export default Investments;
