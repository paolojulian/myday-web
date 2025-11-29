import { AppBottomSheet } from '@/components/atoms/app-bottom-sheet';
import React, { useState } from 'react';
import Calendar from './calendar';

type Props = {
  onDateChange?: (date: Date) => void;
  value?: Date;
  children?: ({ handleOpen }: { handleOpen: () => void }) => React.ReactNode;
};

function AppDatePicker({ onDateChange, children, value }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(
    value || null
  );

  const handleOpen = () => {
    setTempSelectedDate(value || null);
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onDateChange?.(tempSelectedDate);
    }
    handleClose();
  };

  return (
    <>
      {children && children({ handleOpen })}
      <AppBottomSheet
        onClose={handleClose}
        isOpen={isOpen}
        HeaderComponent={null}
        HeaderRightComponent={null}
        height='auto'
        title='Select Date'
        variant='custom'
        zIndex={1001}
      >
        <Calendar
          selectedDate={tempSelectedDate}
          onDateSelect={setTempSelectedDate}
          onConfirm={handleConfirm}
          onCancel={handleClose}
        />
      </AppBottomSheet>
    </>
  );
}

export default AppDatePicker;
