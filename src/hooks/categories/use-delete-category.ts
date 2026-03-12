import { useState } from 'react';
import { categoryService } from '@/services/category-service/category.service';

export function useDeleteCategory() {
  const [isPending, setIsPending] = useState(false);

  const execute = async (id: string) => {
    setIsPending(true);
    try {
      const error = await categoryService.delete(id);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
}
