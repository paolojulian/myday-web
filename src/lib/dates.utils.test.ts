import dayjs from 'dayjs';
import {
  formatMonthYear,
  getDaysElapsedInMonth,
  getDaysRemainingInMonth,
  getDateFormat,
  getEndOfMonth,
  getHumanReadableDate,
  getMonthName,
  getNextDay,
  getNextMonth,
  getNumberOfDaysInMonth,
  getPreviousDay,
  getPreviousMonth,
  getStartAndEndOfDay,
  getStartAndEndOfMonth,
  getStartOfMonth,
  getTotalDaysInMonth,
  getYear,
  isSameDay,
  isSameYearAsToday,
  isToday,
  isYesterday,
} from './dates.utils';

const FIXED = new Date('2024-03-15T12:00:00'); // March 15, 2024 — not today

describe('getStartAndEndOfMonth', () => {
  it('returns the first and last day of the month', () => {
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(FIXED);
    expect(dayjs(startOfMonth).date()).toBe(1);
    expect(dayjs(startOfMonth).month()).toBe(2); // March = 2 (0-indexed)
    expect(dayjs(endOfMonth).date()).toBe(31);
    expect(dayjs(endOfMonth).month()).toBe(2);
  });

  it('handles February in a leap year', () => {
    const feb2024 = new Date('2024-02-10');
    const { startOfMonth, endOfMonth } = getStartAndEndOfMonth(feb2024);
    expect(dayjs(startOfMonth).date()).toBe(1);
    expect(dayjs(endOfMonth).date()).toBe(29); // 2024 is a leap year
  });
});

describe('getStartAndEndOfDay', () => {
  it('returns midnight start and end-of-day for the given date', () => {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(FIXED);
    const start = dayjs(startOfDay);
    const end = dayjs(endOfDay);
    expect(start.hour()).toBe(0);
    expect(start.minute()).toBe(0);
    expect(start.second()).toBe(0);
    expect(end.hour()).toBe(23);
    expect(end.minute()).toBe(59);
    expect(end.second()).toBe(59);
    expect(start.date()).toBe(15);
    expect(end.date()).toBe(15);
  });
});

describe('getNumberOfDaysInMonth', () => {
  it('returns 31 for March', () => {
    expect(getNumberOfDaysInMonth(FIXED)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(getNumberOfDaysInMonth(new Date('2023-02-01'))).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(getNumberOfDaysInMonth(new Date('2024-02-01'))).toBe(29);
  });

  it('returns 30 for April', () => {
    expect(getNumberOfDaysInMonth(new Date('2024-04-01'))).toBe(30);
  });
});

describe('getEndOfMonth', () => {
  it('returns the last moment of the month', () => {
    const end = getEndOfMonth(FIXED);
    const d = dayjs(end);
    expect(d.date()).toBe(31);
    expect(d.month()).toBe(2);
    expect(d.hour()).toBe(23);
  });
});

describe('getDateFormat', () => {
  it('strips the year when the date is in the current year', () => {
    const thisYear = new Date();
    const result = getDateFormat(thisYear);
    expect(result).not.toMatch(/^\d{4}/);
  });

  it('includes the year for dates in a different year', () => {
    const result = getDateFormat(new Date('2020-06-15'));
    expect(result).toBe('2020-06-15');
  });

  it('respects a custom format', () => {
    const result = getDateFormat(new Date('2020-06-15'), 'YYYY/MM/DD');
    expect(result).toBe('2020/06/15');
  });
});

describe('getHumanReadableDate', () => {
  it('omits the year for dates in the current year', () => {
    const thisYear = new Date();
    const result = getHumanReadableDate(thisYear);
    expect(result).not.toContain(String(dayjs().year()));
  });

  it('includes the year for past years', () => {
    const result = getHumanReadableDate(new Date('2020-06-15'));
    expect(result).toContain('2020');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});

describe('getPreviousMonth / getNextMonth', () => {
  it('getPreviousMonth returns the previous calendar month', () => {
    const prev = getPreviousMonth(FIXED);
    expect(dayjs(prev).month()).toBe(1); // February
    expect(dayjs(prev).year()).toBe(2024);
  });

  it('getNextMonth returns the next calendar month', () => {
    const next = getNextMonth(FIXED);
    expect(dayjs(next).month()).toBe(3); // April
    expect(dayjs(next).year()).toBe(2024);
  });

  it('wraps year correctly going from January backwards', () => {
    const jan2024 = new Date('2024-01-15');
    const prev = getPreviousMonth(jan2024);
    expect(dayjs(prev).month()).toBe(11); // December
    expect(dayjs(prev).year()).toBe(2023);
  });

  it('wraps year correctly going from December forward', () => {
    const dec2023 = new Date('2023-12-15');
    const next = getNextMonth(dec2023);
    expect(dayjs(next).month()).toBe(0); // January
    expect(dayjs(next).year()).toBe(2024);
  });
});

describe('isSameYearAsToday', () => {
  it('returns true for a date in the current year', () => {
    expect(isSameYearAsToday(new Date())).toBe(true);
  });

  it('returns false for a date in a past year', () => {
    expect(isSameYearAsToday(new Date('2020-01-01'))).toBe(false);
  });
});

describe('isSameDay', () => {
  it('returns true for two dates on the same calendar day', () => {
    expect(
      isSameDay(new Date('2024-03-15T08:00:00'), new Date('2024-03-15T23:59:59'))
    ).toBe(true);
  });

  it('returns false for dates on different days', () => {
    expect(
      isSameDay(new Date('2024-03-15'), new Date('2024-03-16'))
    ).toBe(false);
  });
});

describe('formatMonthYear', () => {
  it('formats as "Month YYYY"', () => {
    expect(formatMonthYear(FIXED)).toBe('March 2024');
  });
});

describe('getMonthName', () => {
  it('returns the full month name', () => {
    expect(getMonthName(FIXED)).toBe('March');
    expect(getMonthName(new Date('2024-01-01'))).toBe('January');
  });
});

describe('getYear', () => {
  it('returns the numeric year', () => {
    expect(getYear(FIXED)).toBe(2024);
    expect(getYear(new Date('2020-06-01'))).toBe(2020);
  });
});

describe('getDaysElapsedInMonth', () => {
  it('returns the day-of-month for the given date', () => {
    expect(getDaysElapsedInMonth(new Date('2024-03-15'))).toBe(15);
    expect(getDaysElapsedInMonth(new Date('2024-03-01'))).toBe(1);
    expect(getDaysElapsedInMonth(new Date('2024-03-31'))).toBe(31);
  });
});

describe('getTotalDaysInMonth', () => {
  it('returns total days for March', () => {
    expect(getTotalDaysInMonth(new Date('2024-03-01'))).toBe(31);
  });

  it('returns total days for a 30-day month', () => {
    expect(getTotalDaysInMonth(new Date('2024-04-01'))).toBe(30);
  });
});

describe('getDaysRemainingInMonth', () => {
  it('returns days remaining after the current day', () => {
    const date = new Date('2024-03-15');
    expect(getDaysRemainingInMonth(date)).toBe(31 - 15); // 16
  });

  it('returns 0 on the last day of the month', () => {
    expect(getDaysRemainingInMonth(new Date('2024-03-31'))).toBe(0);
  });
});

describe('getStartOfMonth', () => {
  it('returns midnight on the 1st of the given month', () => {
    const start = getStartOfMonth(FIXED);
    const d = dayjs(start);
    expect(d.date()).toBe(1);
    expect(d.month()).toBe(2);
    expect(d.year()).toBe(2024);
  });
});

describe('getPreviousDay / getNextDay', () => {
  it('getPreviousDay subtracts one day', () => {
    const prev = getPreviousDay(FIXED);
    expect(dayjs(prev).date()).toBe(14);
    expect(dayjs(prev).month()).toBe(2);
  });

  it('getNextDay adds one day', () => {
    const next = getNextDay(FIXED);
    expect(dayjs(next).date()).toBe(16);
  });

  it('wraps months correctly', () => {
    const march1 = new Date('2024-03-01');
    const prev = getPreviousDay(march1);
    expect(dayjs(prev).date()).toBe(29); // Feb 29 (leap year)
    expect(dayjs(prev).month()).toBe(1);
  });
});

describe('isToday', () => {
  it('returns true for the current date', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isToday(dayjs().subtract(1, 'day').toDate())).toBe(false);
  });
});

describe('isYesterday', () => {
  it('returns true for yesterday', () => {
    expect(isYesterday(dayjs().subtract(1, 'day').toDate())).toBe(true);
  });

  it('returns false for today', () => {
    expect(isYesterday(new Date())).toBe(false);
  });

  it('returns false for two days ago', () => {
    expect(isYesterday(dayjs().subtract(2, 'days').toDate())).toBe(false);
  });
});
