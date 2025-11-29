import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  generateCalendarDays,
  getMonthOptions,
  getYearOptions,
  CalendarDay,
} from '@/lib/calendar.utils';
import { getPreviousMonth, getNextMonth } from '@/lib/dates.utils';

type UseCalendarStateProps = {
  initialDate?: Date | null;
};

export function useCalendarState({ initialDate }: UseCalendarStateProps = {}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    initialDate || new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate || null
  );

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth, selectedDate),
    [currentMonth, selectedDate]
  );

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const yearOptions = useMemo(() => getYearOptions(), []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => getPreviousMonth(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => getNextMonth(prev));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  const selectMonth = useCallback((monthIndex: number) => {
    setCurrentMonth((prev) => dayjs(prev).month(monthIndex).toDate());
  }, []);

  const selectYear = useCallback((year: number) => {
    setCurrentMonth((prev) => dayjs(prev).year(year).toDate());
  }, []);

  const handleDaySelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    // State
    currentMonth,
    selectedDate,
    calendarDays,
    monthOptions,
    yearOptions,

    // Actions
    setSelectedDate: handleDaySelect,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectMonth,
    selectYear,
  };
}

export type { CalendarDay };
