import { useEffect, useState } from 'react';
import { db } from '@/repository';

export type SyncState = 'offline' | 'connecting' | 'online' | 'error';

export const useDexieSync = () => {
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [isInitialSync, setIsInitialSync] = useState(true);

  useEffect(() => {
    // Subscribe to sync state changes
    const syncStateSubscription = db.cloud.syncState.subscribe((state) => {
      if (state.phase === 'offline') {
        setSyncState('offline');
        setIsInitialSync(false);
      } else if (state.phase === 'initial' || state.phase === 'pulling' || state.phase === 'pushing') {
        setSyncState('connecting');
      } else if (state.phase === 'in-sync') {
        setSyncState('online');
        setIsInitialSync(false);
      } else if (state.phase === 'error') {
        setSyncState('error');
        setIsInitialSync(false);
      }
    });

    return () => {
      syncStateSubscription.unsubscribe();
    };
  }, []);

  return {
    syncState,
    isInitialSync,
    isOnline: syncState === 'online',
    isConnecting: syncState === 'connecting',
    isOffline: syncState === 'offline',
    hasError: syncState === 'error',
  };
};
