import ThreeWayDatePickerButton from '@/components/atoms/3-way-date-picker/3-way-date-picker-button';
import { AppDatePicker } from '@/components/atoms/app-date-picker';
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
        <div className='size-6 rounded-full bg-neutral-400'></div>
        <p>Today</p>
      </ThreeWayDatePickerButton>
      <ThreeWayDatePickerButton
        onClick={handleTomorrowClicked}
        isActive={isTomorrow}
      >
        <div className='size-6 rounded-full bg-neutral-400'></div>
        <p>Tomorrow</p>
      </ThreeWayDatePickerButton>
      <AppDatePicker>
        {({ handleOpen }) => (
          <ThreeWayDatePickerButton
            onClick={() => {
              handleCustomClicked();
              handleOpen();
            }}
            isActive={!isToday && !isTomorrow && !!value}
          >
            <div className='size-6 rounded-full bg-neutral-400'></div>
            <p>Custom</p>
          </ThreeWayDatePickerButton>
        )}
      </AppDatePicker>
    </div>
  );
}

export default ThreeWayDatePicker;
