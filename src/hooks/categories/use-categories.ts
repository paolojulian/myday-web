import { useLiveQuery } from 'dexie-react-hooks';
import { categoryService } from '@/services/category-service/category.service';

export function useCategories() {
  const categories = useLiveQuery(() => categoryService.list(), []);

  return {
    data: categories ?? [],
    isLoading: categories === undefined,
  };
}
