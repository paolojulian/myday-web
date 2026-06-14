import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/repository';
import { compareByExpiration } from '@/services/warranty-service/warranty.service';

/** All warranties, live, sorted by soonest expiration first (undated last). */
export const useWarrantiesLive = () => {
  const data = useLiveQuery(async () => {
    const warranties = await db.warranties.toArray();
    return warranties.sort(compareByExpiration);
  }, []);

  return {
    data: data ?? [],
    isLoading: data === undefined,
  };
};
