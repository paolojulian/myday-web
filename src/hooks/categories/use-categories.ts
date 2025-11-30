import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/category-service/category.service';

export const CATEGORIES_QUERY_KEY = ['categories'];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoryService.list(),
    staleTime: Infinity, // Categories rarely change, so keep them fresh
  });
}
