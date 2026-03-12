import { useState } from 'react';
import { categoryService } from '@/services/category-service/category.service';

type CreateCategoryParams = {
  name: string;
};

export function useCreateCategory() {
  const [isPending, setIsPending] = useState(false);

  const execute = async (params: CreateCategoryParams) => {
    setIsPending(true);
    try {
      const { error, category } = await categoryService.add(params);
      if (error) throw error;
      return category;
    } finally {
      setIsPending(false);
    }
  };

  return { execute, isPending };
}
