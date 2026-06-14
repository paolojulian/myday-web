import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/repository';

export const useWarrantyLive = (id: string | null | undefined) => {
  const data = useLiveQuery(
    () => (id ? db.warranties.get(id) : undefined),
    [id]
  );

  return {
    data,
    isLoading: !!id && data === undefined,
  };
};
