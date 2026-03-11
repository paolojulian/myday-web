import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category-service/category.service';
import { CATEGORIES_QUERY_KEY } from './use-categories';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const error = await categoryService.delete(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
