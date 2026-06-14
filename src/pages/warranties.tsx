import { AppPageHeader } from '@/components/atoms';
import AppTypography from '@/components/atoms/app-typography';
import WarrantyListItem from '@/components/organisms/warranty-list-item/warranty-list-item';
import { useWarrantiesLive } from '@/hooks/warranties/use-warranties-live';
import { useDeleteWarranty } from '@/hooks/warranties/use-delete-warranty';
import { Warranty } from '@/repository';
import { FC } from 'react';

const Warranties: FC = () => {
  const { data: warranties, isLoading } = useWarrantiesLive();
  const deleteWarranty = useDeleteWarranty();

  const handleDelete = (warranty: Warranty) => {
    if (!warranty.id) return;
    if (!window.confirm(`Delete "${warranty.title}"?`)) return;
    deleteWarranty.execute(warranty.id);
  };

  return (
    <div className='pb-44'>
      <AppPageHeader title='Xpense' description='Warranties' />

      {isLoading && (
        <AppTypography
          variant='small'
          className='text-neutral-400 text-center py-8 block'
        >
          Loading...
        </AppTypography>
      )}

      {!isLoading && warranties.length === 0 && (
        <div className='text-center py-16'>
          <AppTypography variant='small' className='text-neutral-400'>
            No warranties yet — add a receipt photo when logging an expense
          </AppTypography>
        </div>
      )}

      <div className='mt-4 flex flex-col gap-2'>
        {warranties.map((warranty) => (
          <WarrantyListItem
            key={warranty.id}
            warranty={warranty}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default Warranties;
