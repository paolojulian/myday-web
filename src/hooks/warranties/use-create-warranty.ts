import { useState } from 'react';
import { Warranty } from '@/repository';
import {
  AddWarrantyParams,
  warrantyService,
} from '@/services/warranty-service/warranty.service';
import { warrantySyncService } from '@/services/warranty-service/warranty-sync.service';

export const useCreateWarranty = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: AddWarrantyParams): Promise<Warranty> => {
    setIsPending(true);
    try {
      const [warranty, error] = await warrantyService.add(params);
      if (error || !warranty) throw error ?? new Error('Unable to add warranty');

      // Fire-and-forget upload; the local record already exists offline.
      void warrantySyncService.drainQueue();

      return warranty;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
