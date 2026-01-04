import dayjs from 'dayjs';

export function getStartAndEndOfMonth(date: Date) {
  const startOfMonth = dayjs(date).startOf('month').toDate();
  const endOfMonth = getEndOfMonth(date);

  return {
    startOfMonth,
    endOfMonth,
  };
}

export function getStartAndEndOfDay(date: Date) {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  return {
    startOfDay,
    endOfDay,
  };
}

export function getNumberOfDaysInMonth(date: Date) {
  return dayjs(date).daysInMonth();
}

export function getEndOfMonth(date: Date) {
  return dayjs(date).endOf('month').toDate();
}

export function getDateFormat(date: Date, format = 'YYYY-MM-DD') {
  const dayjsDate = dayjs(date);
  if (dayjsDate.isSame(dayjs(), 'year')) {
    return dayjs(date).format(format.replace('YYYY-', ''));
  }
  return dayjs(date).format(format);
}

export function getHumanReadableDate(date: Date) {
  const dayjsDate = dayjs(date);
  if (dayjsDate.isSame(dayjs(), 'year')) {
    return dayjs(date).format('MMM DD');
  }
  return dayjs(date).format('MMM DD, YYYY');
}

export function getPreviousMonth(date: Date) {
  return dayjs(date).subtract(1, 'month').toDate();
}

export function getNextMonth(date: Date) {
  return dayjs(date).add(1, 'month').toDate();
}

export function isSameYearAsToday(date: Date) {
  return dayjs(date).isSame(new Date(), 'year');
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'day');
}

export function formatMonthYear(date: Date): string {
  return dayjs(date).format('MMMM YYYY');
}

export function getMonthName(date: Date): string {
  return dayjs(date).format('MMMM');
}

export function getYear(date: Date): number {
  return dayjs(date).year();
}

export function getDaysElapsedInMonth(date: Date = new Date()): number {
  return dayjs(date).date();
}

export function getTotalDaysInMonth(date: Date = new Date()): number {
  return dayjs(date).daysInMonth();
}

export function getDaysRemainingInMonth(date: Date = new Date()): number {
  const totalDays = getTotalDaysInMonth(date);
  const currentDay = getDaysElapsedInMonth(date);
  return totalDays - currentDay;
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return dayjs(date).startOf('month').toDate();
}
