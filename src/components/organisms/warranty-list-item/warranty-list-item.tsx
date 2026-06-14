import AppTypography from '@/components/atoms/app-typography';
import { Warranty, WarrantyUploadStatus } from '@/repository';
import {
  getWarrantyExpiryStatus,
  WarrantyExpiryTone,
} from '@/lib/warranty.utils';
import { FC, useEffect, useState } from 'react';

type Props = {
  warranty: Warranty;
  onDelete?: (warranty: Warranty) => void;
};

const toneClasses: Record<WarrantyExpiryTone, string> = {
  expired: 'bg-red-50 text-red-600',
  soon: 'bg-amber-50 text-amber-600',
  ok: 'bg-emerald-50 text-emerald-600',
  none: 'bg-neutral-100 text-neutral-500',
};

const WarrantyListItem: FC<Props> = ({ warranty, onDelete }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!warranty.image_blob) {
      setBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(warranty.image_blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [warranty.image_blob]);

  const thumbnailUrl = blobUrl ?? warranty.image_url ?? null;
  const expiry = getWarrantyExpiryStatus(warranty.expiration_date);
  const isUnsynced = warranty.upload_status !== WarrantyUploadStatus.Synced;

  return (
    <div className='flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-3'>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`${warranty.title} receipt`}
          className='h-14 w-14 rounded-lg object-cover bg-neutral-200 flex-shrink-0'
        />
      ) : (
        <div className='h-14 w-14 rounded-lg bg-neutral-200 flex-shrink-0' />
      )}

      <div className='flex-1 min-w-0'>
        <AppTypography
          variant='body'
          className='font-medium text-neutral-900 truncate'
        >
          {warranty.title}
        </AppTypography>
        <div className='mt-1 flex items-center gap-2'>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[expiry.tone]}`}
          >
            {expiry.label}
          </span>
          {isUnsynced && (
            <span className='text-xs text-neutral-400'>· not uploaded</span>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          type='button'
          onClick={() => onDelete(warranty)}
          aria-label={`Delete ${warranty.title}`}
          className='text-neutral-400 hover:text-red-500 p-1'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className='w-4 h-4'
          >
            <path
              fillRule='evenodd'
              d='M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default WarrantyListItem;
