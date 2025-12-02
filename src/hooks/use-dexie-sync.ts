import { db } from '@/repository';
import { useEffect, useState } from 'react';

export type SyncState = 'offline' | 'connecting' | 'online' | 'error';

export const useDexieSync = () => {
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to Dexie Cloud sync state
    const subscription = db.cloud.syncState.subscribe((state) => {
      console.log('Dexie Sync State:', state);

      if (state.phase === 'offline') {
        setSyncState('offline');
        setIsInitialSync(false);
        setErrorMessage(null);
      } else if (
        state.phase === 'initial' ||
        state.phase === 'pulling' ||
        state.phase === 'pushing'
      ) {
        setSyncState('connecting');
        setErrorMessage(null);
      } else if (state.phase === 'in-sync') {
        setSyncState('online');
        setIsInitialSync(false);
        setErrorMessage(null);
      } else if (state.phase === 'error') {
        setSyncState('error');
        setIsInitialSync(false);

        // Extract error details
        const error = state.error;
        if (error) {
          const errorText = error.message || error.toString();

          // Check for CORS errors
          if (
            errorText.includes('Failed to fetch') ||
            errorText.includes('CORS')
          ) {
            setErrorMessage(
              'CORS Error: Your domain needs to be whitelisted in Dexie Cloud dashboard. ' +
                'Visit https://dexie.cloud to add your domain to allowed origins.'
            );
          } else {
            setErrorMessage(`Sync error: ${errorText}`);
          }

          console.error('Dexie Cloud Sync Error:', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    syncState,
    isInitialSync,
    errorMessage,
    isOnline: syncState === 'online',
    isConnecting: syncState === 'connecting',
    isOffline: syncState === 'offline',
    hasError: syncState === 'error',
  };
};
