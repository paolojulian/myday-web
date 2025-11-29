import { FC } from 'react';
import { useCalendarState } from '../hooks/use-calendar-state';
import CalendarHeader from './calendar-header';
import CalendarGrid from './calendar-grid';
import CalendarFooter from './calendar-footer';

type CalendarProps = {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const Calendar: FC<CalendarProps> = ({
  selectedDate: externalSelectedDate,
  onDateSelect,
  onConfirm,
}) => {
  const {
    currentMonth,
    selectedDate,
    calendarDays,
    monthOptions,
    yearOptions,
    setSelectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectMonth,
    selectYear,
  } = useCalendarState({
    initialDate: externalSelectedDate,
  });

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  return (
    <div className='flex flex-col gap-4 pb-2'>
      <CalendarHeader
        currentMonth={currentMonth}
        monthOptions={monthOptions}
        yearOptions={yearOptions}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onMonthSelect={selectMonth}
        onYearSelect={selectYear}
      />

      <CalendarGrid calendarDays={calendarDays} onDaySelect={handleDaySelect} />

      <CalendarFooter
        selectedDate={selectedDate}
        onTodayClick={goToToday}
        onConfirm={onConfirm}
      />
    </div>
  );
};

export default Calendar;
