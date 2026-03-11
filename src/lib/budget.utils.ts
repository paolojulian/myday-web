import {
  getDaysElapsedInMonth,
  getDaysRemainingInMonth,
  getTotalDaysInMonth,
} from './dates.utils';

export type BudgetStatus = 'healthy' | 'warning' | 'danger';

export interface BudgetAnalysis {
  // Raw data
  monthlyBudget: number;
  totalSpent: number;
  remainingBudget: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;

  // Calculated metrics
  budgetedDailyRate: number; // How much you SHOULD spend per day
  actualDailyRate: number; // How much you ARE spending per day
  projectedTotalSpend: number; // What you'll spend by month end at current rate
  projectedDaysLeft: number; // How many days until budget runs out
  remainingDailyBudget: number; // How much you can spend daily to stay within budget

  // Status indicators
  status: BudgetStatus;
  percentageUsed: number; // 0-100
  isOverBudget: boolean;
  isOnTrack: boolean;
}

/**
 * Calculate how much you can spend per day for the rest of the month (including today),
 * excluding bills from the effective budget.
 */
function getRemainingDailyBudget(
  monthlyBudget: number,
  totalSpent: number,
  date: Date = new Date(),
  billsSpent: number = 0
): number {
  const daysRemaining = getDaysRemainingInMonth(date);
  // Include today in the remaining days
  const daysLeft = daysRemaining + 1;
  if (daysLeft <= 0) return 0;

  const effectiveBudget = monthlyBudget - billsSpent;
  const nonBillsSpent = totalSpent - billsSpent;
  return (effectiveBudget - nonBillsSpent) / daysLeft;
}

export function calculateBudgetAnalysis(
  monthlyBudget: number,
  totalSpent: number,
  date: Date = new Date(),
  billsSpent: number = 0
): BudgetAnalysis {
  const daysElapsed = getDaysElapsedInMonth(date);
  const daysRemaining = getDaysRemainingInMonth(date);
  const totalDays = getTotalDaysInMonth(date);

  const remainingDailyBudget = getRemainingDailyBudget(
    monthlyBudget,
    totalSpent,
    date,
    billsSpent
  );

  // Calculate rates
  const budgetedDailyRate = monthlyBudget / totalDays;

  // Calculate actual daily rate:
  // - Bills are spread across the entire month (billsSpent / totalDays)
  // - Regular expenses are based on days elapsed (nonBillsSpent / daysElapsed)
  const nonBillsSpent = totalSpent - billsSpent;
  const billsDailyRate = billsSpent / totalDays;
  const nonBillsDailyRate = daysElapsed > 0 ? nonBillsSpent / daysElapsed : 0;
  const actualDailyRate = billsDailyRate + nonBillsDailyRate;

  // Calculate projections
  const projectedTotalSpend = actualDailyRate * totalDays;
  const remainingBudget = monthlyBudget - totalSpent;
  const projectedDaysLeft =
    actualDailyRate > 0 ? remainingBudget / actualDailyRate : daysRemaining;

  // Calculate status
  const percentageUsed = (totalSpent / monthlyBudget) * 100;
  const expectedPercentage = (daysElapsed / totalDays) * 100;
  const isOverBudget = totalSpent > monthlyBudget;

  // On track if spending within 10% of expected
  const isOnTrack = !isOverBudget && percentageUsed <= expectedPercentage * 1.1;

  // Determine status
  let status: BudgetStatus;
  if (isOverBudget || percentageUsed > 90) {
    status = 'danger';
  } else if (percentageUsed > expectedPercentage * 1.1 || percentageUsed > 75) {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  return {
    monthlyBudget,
    totalSpent,
    remainingBudget,
    remainingDailyBudget,
    daysElapsed,
    daysRemaining,
    totalDays,
    budgetedDailyRate,
    actualDailyRate,
    projectedTotalSpend,
    projectedDaysLeft: Math.max(0, projectedDaysLeft),
    status,
    percentageUsed: Math.min(100, percentageUsed),
    isOverBudget,
    isOnTrack,
  };
}

export function getBudgetStatusEmoji(status: BudgetStatus): string {
  switch (status) {
    case 'healthy':
      return '😊';
    case 'warning':
      return '😟';
    case 'danger':
      return '😱';
  }
}

export function getBudgetStatusColor(status: BudgetStatus): {
  bg: string;
  border: string;
  text: string;
  progress: string;
} {
  switch (status) {
    case 'healthy':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        progress: 'bg-green-500',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        progress: 'bg-yellow-500',
      };
    case 'danger':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        progress: 'bg-red-500',
      };
  }
}
