import { useState } from 'react';
import { warrantyService } from '@/services/warranty-service/warranty.service';

export const useDeleteWarranty = () => {
  const [isPending, setIsPending] = useState(false);

  const execute = async (id: string) => {
    setIsPending(true);
    try {
      const error = await warrantyService.delete(id);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
};
