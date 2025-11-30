import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category-service/category.service';
import { CATEGORIES_QUERY_KEY } from './use-categories';

type CreateCategoryParams = {
  name: string;
};

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCategoryParams) => {
      const error = await categoryService.add(params);
      if (error) {
        throw error;
      }
      return { message: 'Category created successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}
