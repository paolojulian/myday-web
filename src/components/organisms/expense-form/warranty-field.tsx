import { AppDatePicker } from '@/components/atoms/app-date-picker';
import AppTypography from '@/components/atoms/app-typography';
import dayjs from 'dayjs';
import { FC, useEffect, useRef, useState } from 'react';

type Props = {
  imageFile: File | null;
  expirationDate: Date | null;
  /** Already-saved receipt (edit mode) shown when no new file is picked. */
  existingImageUrl?: string | null;
  existingImageBlob?: Blob | null;
  onImageChange: (file: File | null) => void;
  onExpirationChange: (date: Date | null) => void;
  /** Called when the user removes an existing receipt (edit mode). */
  onRemove?: () => void;
};

const WarrantyField: FC<Props> = ({
  imageFile,
  expirationDate,
  existingImageUrl,
  existingImageBlob,
  onImageChange,
  onExpirationChange,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // A picked file takes precedence over an existing local blob for the preview.
  const blobToPreview = imageFile ?? existingImageBlob ?? null;

  // Manage the preview object URL lifecycle.
  useEffect(() => {
    if (!blobToPreview) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(blobToPreview);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blobToPreview]);

  const previewUrl = objectUrl ?? existingImageUrl ?? null;
  const hasReceipt = !!previewUrl;

  const handlePick = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onImageChange(file);
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
  };

  const handleRemove = () => {
    onImageChange(null);
    onExpirationChange(null);
    onRemove?.();
  };

  return (
    <section className='flex flex-col gap-2'>
      <AppTypography
        variant='small'
        className='text-neutral-400 uppercase tracking-wide'
      >
        Warranty receipt · optional
      </AppTypography>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        capture='environment'
        onChange={handleFileChange}
        className='hidden'
      />

      {!hasReceipt && (
        <button
          type='button'
          onClick={handlePick}
          className='flex items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-4 text-neutral-500 active:scale-[0.99] transition-transform'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className='w-5 h-5'
          >
            <path d='M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z' />
            <path
              fillRule='evenodd'
              d='M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z'
              clipRule='evenodd'
            />
          </svg>
          <AppTypography variant='body' className='font-medium'>
            Add receipt photo
          </AppTypography>
        </button>
      )}

      {hasReceipt && (
        <div className='flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3'>
          <div className='flex items-center gap-3'>
            <img
              src={previewUrl}
              alt='Warranty receipt'
              className='h-16 w-16 rounded-xl object-cover bg-neutral-200'
            />
            <div className='flex-1 flex gap-2'>
              <button
                type='button'
                onClick={handlePick}
                className='text-sm font-medium text-neutral-700 underline'
              >
                Replace
              </button>
              <button
                type='button'
                onClick={handleRemove}
                className='text-sm font-medium text-red-500 underline'
              >
                Remove
              </button>
            </div>
          </div>

          <AppDatePicker
            value={expirationDate ?? undefined}
            onDateChange={(date) => onExpirationChange(date)}
          >
            {({ handleOpen }) => (
              <button
                type='button'
                onClick={handleOpen}
                className='flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5'
              >
                <AppTypography variant='small' className='text-neutral-500'>
                  Expiration date
                </AppTypography>
                <AppTypography variant='body' className='font-medium text-neutral-900'>
                  {expirationDate
                    ? dayjs(expirationDate).format('MMM D, YYYY')
                    : 'Set date'}
                </AppTypography>
              </button>
            )}
          </AppDatePicker>
        </div>
      )}
    </section>
  );
};

export default WarrantyField;
