const INVESTMENT_PROJECTION_MONTHLY_ADD_KEY =
  'myday_investment_projection_monthly_add';
const DEFAULT_PROJECTION_MONTHLY_ADD = '25000';

export function getSavedProjectionMonthlyAdd(storage: Storage): string {
  return (
    storage.getItem(INVESTMENT_PROJECTION_MONTHLY_ADD_KEY) ??
    DEFAULT_PROJECTION_MONTHLY_ADD
  );
}

export function saveProjectionMonthlyAdd(
  storage: Storage,
  monthlyAdd: string
): void {
  storage.setItem(INVESTMENT_PROJECTION_MONTHLY_ADD_KEY, monthlyAdd);
}
