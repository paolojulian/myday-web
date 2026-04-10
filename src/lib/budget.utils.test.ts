import {
  calculateBudgetAnalysis,
  getBudgetStatusColor,
  getBudgetStatusEmoji,
} from './budget.utils';

// Fixed date: January 15, 2024 — 31-day month, 15 days elapsed, 16 remaining
const JAN_15_2024 = new Date('2024-01-15T12:00:00');

describe('calculateBudgetAnalysis', () => {
  describe('raw data fields', () => {
    it('passes through monthlyBudget and totalSpent unchanged', () => {
      const result = calculateBudgetAnalysis(3000, 1000, JAN_15_2024);
      expect(result.monthlyBudget).toBe(3000);
      expect(result.totalSpent).toBe(1000);
    });

    it('calculates remainingBudget as monthlyBudget - totalSpent', () => {
      const result = calculateBudgetAnalysis(3000, 1200, JAN_15_2024);
      expect(result.remainingBudget).toBe(1800);
    });

    it('sets daysElapsed, daysRemaining, totalDays for Jan 15', () => {
      const result = calculateBudgetAnalysis(3000, 1000, JAN_15_2024);
      expect(result.totalDays).toBe(31);
      expect(result.daysElapsed).toBe(15);
      expect(result.daysRemaining).toBe(16);
    });
  });

  describe('calculated metrics', () => {
    it('budgetedDailyRate = monthlyBudget / totalDays', () => {
      const result = calculateBudgetAnalysis(3100, 0, JAN_15_2024);
      expect(result.budgetedDailyRate).toBeCloseTo(100, 2);
    });

    it('actualDailyRate is 0 when nothing has been spent', () => {
      const result = calculateBudgetAnalysis(3000, 0, JAN_15_2024);
      expect(result.actualDailyRate).toBe(0);
    });

    it('actualDailyRate = (nonBillsSpent / daysElapsed) + (billsSpent / totalDays)', () => {
      // nonBillsSpent=1500, daysElapsed=15 → nonBillsRate=100
      // billsSpent=310, totalDays=31 → billsRate=10
      // actualDailyRate = 110
      const result = calculateBudgetAnalysis(4000, 1810, JAN_15_2024, 310);
      expect(result.actualDailyRate).toBeCloseTo(110, 2);
    });

    it('projectedTotalSpend = actualDailyRate * totalDays', () => {
      const result = calculateBudgetAnalysis(3100, 1550, JAN_15_2024);
      // nonBillsRate = 1550/15 ≈ 103.33, projected = 103.33 * 31 ≈ 3203.33
      expect(result.projectedTotalSpend).toBeCloseTo(result.actualDailyRate * 31, 2);
    });

    it('remainingDailyBudget = (budget - spent) / (daysRemaining + 1)', () => {
      // budget=3100, spent=1500, daysRemaining=16, daysLeft=17
      // (3100-1500)/17 ≈ 94.12
      const result = calculateBudgetAnalysis(3100, 1500, JAN_15_2024);
      expect(result.remainingDailyBudget).toBeCloseTo(1600 / 17, 2);
    });

    it('remainingDailyBudget excludes bills from effective budget', () => {
      // effectiveBudget = 3100 - 400 = 2700, nonBillsSpent = 1500 - 400 = 1100
      // (2700 - 1100) / 17 = 1600/17 ≈ 94.12
      const result = calculateBudgetAnalysis(3100, 1500, JAN_15_2024, 400);
      expect(result.remainingDailyBudget).toBeCloseTo(1600 / 17, 2);
    });

    it('projectedDaysLeft clamps to 0 when already over budget', () => {
      const result = calculateBudgetAnalysis(1000, 1200, JAN_15_2024);
      expect(result.projectedDaysLeft).toBe(0);
    });
  });

  describe('status indicators', () => {
    it('status is "healthy" when spending is on pace', () => {
      // Exactly on pace: spent = 15/31 * 3100 ≈ 1500
      const result = calculateBudgetAnalysis(3100, 1500, JAN_15_2024);
      expect(result.status).toBe('healthy');
      expect(result.isOnTrack).toBe(true);
    });

    it('status is "danger" when over budget', () => {
      const result = calculateBudgetAnalysis(1000, 1100, JAN_15_2024);
      expect(result.status).toBe('danger');
      expect(result.isOverBudget).toBe(true);
    });

    it('status is "danger" when percentageUsed > 90', () => {
      const result = calculateBudgetAnalysis(1000, 920, JAN_15_2024);
      expect(result.status).toBe('danger');
    });

    it('status is "warning" when percentageUsed > 75', () => {
      const result = calculateBudgetAnalysis(1000, 780, JAN_15_2024);
      expect(result.status).toBe('warning');
    });

    it('isOverBudget is false when under budget', () => {
      const result = calculateBudgetAnalysis(1000, 500, JAN_15_2024);
      expect(result.isOverBudget).toBe(false);
    });

    it('percentageUsed is capped at 100 even when over budget', () => {
      const result = calculateBudgetAnalysis(1000, 2000, JAN_15_2024);
      expect(result.percentageUsed).toBe(100);
    });

    it('isOnTrack is false when over budget', () => {
      const result = calculateBudgetAnalysis(1000, 1100, JAN_15_2024);
      expect(result.isOnTrack).toBe(false);
    });
  });
});

describe('getBudgetStatusEmoji', () => {
  it('returns a happy emoji for healthy', () => {
    expect(getBudgetStatusEmoji('healthy')).toBe('😊');
  });

  it('returns a sad emoji for warning', () => {
    expect(getBudgetStatusEmoji('warning')).toBe('😟');
  });

  it('returns a scared emoji for danger', () => {
    expect(getBudgetStatusEmoji('danger')).toBe('😱');
  });
});

describe('getBudgetStatusColor', () => {
  it('returns green classes for healthy', () => {
    const colors = getBudgetStatusColor('healthy');
    expect(colors.bg).toContain('green');
    expect(colors.border).toContain('green');
    expect(colors.text).toContain('green');
    expect(colors.progress).toContain('green');
  });

  it('returns yellow classes for warning', () => {
    const colors = getBudgetStatusColor('warning');
    expect(colors.bg).toContain('yellow');
    expect(colors.border).toContain('yellow');
    expect(colors.text).toContain('yellow');
    expect(colors.progress).toContain('yellow');
  });

  it('returns red classes for danger', () => {
    const colors = getBudgetStatusColor('danger');
    expect(colors.bg).toContain('red');
    expect(colors.border).toContain('red');
    expect(colors.text).toContain('red');
    expect(colors.progress).toContain('red');
  });
});
