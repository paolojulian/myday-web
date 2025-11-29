import { FC } from 'react';
import AppTypography from '@/components/atoms/app-typography';
import { CalendarDay } from '../hooks/use-calendar-state';
import CalendarDayCell from './calendar-day-cell';

type CalendarGridProps = {
  calendarDays: CalendarDay[];
  onDaySelect: (date: Date) => void;
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: FC<CalendarGridProps> = ({ calendarDays, onDaySelect }) => {
  return (
    <div className='flex flex-col gap-2'>
      {/* Week day labels */}
      <div className='grid grid-cols-7 gap-1'>
        {WEEK_DAYS.map((day) => (
          <div key={day} className='h-10 flex items-center justify-center'>
            <AppTypography variant='small' className='text-neutral-600'>
              {day}
            </AppTypography>
          </div>
        ))}
      </div>

      {/* Calendar day cells */}
      <div className='grid grid-cols-7 gap-1'>
        {calendarDays.map((day, index) => (
          <CalendarDayCell
            key={`${day.date.toISOString()}-${index}`}
            day={day}
            onClick={onDaySelect}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
