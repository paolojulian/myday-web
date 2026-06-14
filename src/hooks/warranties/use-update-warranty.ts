import { useState } from 'react';
import {
  UpdateWarrantyParams,
  warrantyService,
} from '@/services/warranty-service/warranty.service';

export const useUpdateWarranty = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: UpdateWarrantyParams) => {
    setIsPending(true);
    try {
      const error = await warrantyService.update(params);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
