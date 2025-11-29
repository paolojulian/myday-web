import ThreeWayDatePickerButton from '@/components/atoms/3-way-date-picker/3-way-date-picker-button';
import { AppDatePicker } from '@/components/atoms/app-date-picker';
import AppTypography from '@/components/atoms/app-typography';
import CustomCalendarIcon from '@/components/atoms/icons/custom-calendar-icon';
import TodayCalendarIcon from '@/components/atoms/icons/today-calendar-icon';
import TomorrowCalendarIcon from '@/components/atoms/icons/tomorrow-calendar-icon';
import dayjs from 'dayjs';
import { useMemo } from 'react';

type Props = {
  onTodayClicked?: () => void;
  onTomorrowClicked?: () => void;
  onDateChanged?: (date: Date) => void;
  value?: Date;
};

function ThreeWayDatePicker({
  onTodayClicked,
  onTomorrowClicked,
  onDateChanged,
  value,
}: Props) {
  const handleTodayClicked = () => {
    onTodayClicked?.();
    onDateChanged?.(dayjs().toDate());
  };

  const handleTomorrowClicked = () => {
    onTomorrowClicked?.();
    onDateChanged?.(dayjs().add(1, 'day').toDate());
  };

  const handleCustomClicked = () => {};

  const isToday: boolean = useMemo(
    () => !!value && dayjs(value).isSame(dayjs()),
    [value]
  );
  const isTomorrow: boolean = useMemo(
    () => !!value && dayjs(value).isSame(dayjs().add(1, 'day')),
    [value]
  );

  return (
    <div className='grid grid-cols-3 gap-2'>
      <ThreeWayDatePickerButton onClick={handleTodayClicked} isActive={isToday}>
        <TodayCalendarIcon className='size-5 text-neutral-700' />
        <AppTypography variant='small'>Today</AppTypography>
      </ThreeWayDatePickerButton>
      <ThreeWayDatePickerButton
        onClick={handleTomorrowClicked}
        isActive={isTomorrow}
      >
        <TomorrowCalendarIcon className='size-5 text-neutral-700' />
        <AppTypography variant='small'>Tomorrow</AppTypography>
      </ThreeWayDatePickerButton>
      <AppDatePicker value={value} onDateChange={onDateChanged}>
        {({ handleOpen }) => (
          <ThreeWayDatePickerButton
            onClick={() => {
              handleCustomClicked();
              handleOpen();
            }}
            isActive={!isToday && !isTomorrow && !!value}
          >
            <CustomCalendarIcon className='size-5 text-neutral-700' />
            <AppTypography variant='small'>Custom</AppTypography>
          </ThreeWayDatePickerButton>
        )}
      </AppDatePicker>
    </div>
  );
}

export default ThreeWayDatePicker;
