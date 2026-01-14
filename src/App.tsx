import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { MutationCache, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { AppSplashScreen } from './components/atoms';
import MainLayout from './components/layouts/main-layout';
import { AuthModal } from './components/organisms/auth-modal/auth-modal';
import { useDexieSync } from './hooks/use-dexie-sync';
import { toast } from './lib/toast';
import ExpenseAdd from './pages/expense-add';
import Expenses from './pages/expenses';
import Home from './pages/home';
import ExpenseEdit from '@/pages/expense-edit';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: 0,
    },
  },
  // configure global cache callbacks to show toast notifications
  mutationCache: new MutationCache({
    onSuccess: (data: unknown) => {
      const message: string = (data as { message: string })?.message;
      if (message) {
        toast.success(message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }),
});

function App() {
  const {
    isInitialSync,
    isConnecting,
    hasError,
    errorMessage,
    isAuthenticated,
  } = useDexieSync();
  const showSplash = isInitialSync && isConnecting;

  // Show error toast when sync fails
  if (hasError && errorMessage) {
    console.warn('Dexie Cloud Sync Error:', errorMessage);
    // Note: The app still works offline, so we don't block the UI
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      {/* Show authentication modal if not authenticated */}
      {!isAuthenticated && (
        <AuthModal
          onAuthenticated={() => {
            // Authentication state will be automatically updated via useDexieSync
            console.log('User authenticated successfully');
          }}
        />
      )}

      {/* Show splash screen during initial sync */}
      <AppSplashScreen isLoading={showSplash} />

      {/* Hide main content while splash screen is showing or not authenticated */}
      {!showSplash && isAuthenticated && (
        <>
          <Routes>
            <Route path='/' element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path='expenses' element={<Expenses />} />
            </Route>
            <Route path='/expenses'>
              <Route path='add' element={<ExpenseAdd />} />
              <Route path=':id' element={<ExpenseEdit />} />
            </Route>
          </Routes>
        </>
      )}
    </PersistQueryClientProvider>
  );
}

export default App;
