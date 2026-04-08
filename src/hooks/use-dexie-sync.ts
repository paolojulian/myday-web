import { db } from '@/repository';
import { useEffect, useState } from 'react';

export type SyncState = 'offline' | 'connecting' | 'online' | 'error' | 'disabled';

export const useDexieSync = () => {
  const syncEnabled = localStorage.getItem('myday_sync_enabled') === 'true';

  const [syncState, setSyncState] = useState<SyncState>(syncEnabled ? 'connecting' : 'disabled');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!syncEnabled);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!syncEnabled) return;

    const authSubscription = db.cloud.currentUser.subscribe((user) => {
      setIsAuthenticated(!!user?.userId);
      setUserEmail(user?.email || null);
    });

    return () => authSubscription.unsubscribe();
  }, [syncEnabled]);

  useEffect(() => {
    if (!syncEnabled) return;

    const subscription = db.cloud.syncState.subscribe((state) => {
      if (state.phase === 'offline') {
        setSyncState('offline');
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
        setErrorMessage(null);
      } else if (state.phase === 'error') {
        setSyncState('error');
        const error = state.error;
        if (error) {
          const errorText = error.message || error.toString();
          if (errorText.includes('Failed to fetch') || errorText.includes('CORS')) {
            setErrorMessage(
              'CORS Error: Your domain needs to be whitelisted in Dexie Cloud dashboard.'
            );
          } else {
            setErrorMessage(`Sync error: ${errorText}`);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [syncEnabled]);

  return {
    syncEnabled,
    syncState,
    errorMessage,
    isOnline: syncState === 'online',
    isConnecting: syncState === 'connecting',
    isOffline: syncState === 'offline',
    hasError: syncState === 'error',
    isAuthenticated,
    userEmail,
  };
};
