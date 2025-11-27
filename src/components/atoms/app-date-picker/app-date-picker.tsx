import { AppBottomSheet } from '@/components/atoms/app-bottom-sheet';
import React, { useState } from 'react';

type Props = {
  onDateChange?: (date: Date) => void;
  value?: Date;
  children?: ({ handleOpen }: { handleOpen: () => void }) => React.ReactNode;
};

function AppDatePicker({ onDateChange, children, value }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

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
        <div>Test</div>
      </AppBottomSheet>
    </>
  );
}

export default AppDatePicker;
