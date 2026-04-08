import { categoryService } from '@/services/category-service/category.service';
import { db } from '@/repository';
import { useLiveQuery } from 'dexie-react-hooks';

export function useTopCategories(limit = 5) {
  const result = useLiveQuery(async () => {
    const [expenses, categories] = await Promise.all([
      db.expenses.toArray(),
      categoryService.list(),
    ]);

    const counts: Record<string, number> = {};
    for (const expense of expenses) {
      if (expense.category_id) {
        counts[expense.category_id] = (counts[expense.category_id] || 0) + 1;
      }
    }

    return [...categories]
      .sort((a, b) => (counts[b.id!] || 0) - (counts[a.id!] || 0))
      .slice(0, limit);
  }, [limit]);

  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}
