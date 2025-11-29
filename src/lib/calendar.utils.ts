import dayjs from 'dayjs';

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
};

/**
 * Generates a 42-day calendar grid (6 weeks × 7 days) for a given month
 * Includes adjacent month dates to fill the grid
 */
export function generateCalendarDays(
  currentMonth: Date,
  selectedDate: Date | null
): CalendarDay[] {
  // Get first day of current month
  const firstDay = dayjs(currentMonth).startOf('month');

  // Get day of week (0=Sunday, 1=Monday, etc.)
  const startDayOfWeek = firstDay.day();

  // Calculate start date (may be from previous month to align with Sunday)
  const startDate = firstDay.subtract(startDayOfWeek, 'day');

  // Generate 42 days (6 weeks * 7 days) for consistent grid
  const days: CalendarDay[] = [];
  const today = dayjs();
  const currentMonthValue = dayjs(currentMonth).month();

  for (let i = 0; i < 42; i++) {
    const date = startDate.add(i, 'day');
    days.push({
      date: date.toDate(),
      isCurrentMonth: date.month() === currentMonthValue,
      isToday: date.isSame(today, 'day'),
      isSelected: selectedDate ? date.isSame(dayjs(selectedDate), 'day') : false,
      isWeekend: date.day() === 0 || date.day() === 6,
    });
  }

  return days;
}

/**
 * Gets array of month names for dropdown
 */
export function getMonthOptions(): string[] {
  return Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'));
}

/**
 * Gets array of years for dropdown (-100 to +10 from current year)
 */
export function getYearOptions(): number[] {
  const currentYear = dayjs().year();
  return Array.from({ length: 111 }, (_, i) => currentYear - 100 + i);
}
