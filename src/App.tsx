import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import "./App.css";
import { BottomBar } from "./components/organisms/bottom-bar";
import { ListExpenses } from "./components/organisms/list-expenses";
import { toast } from "./lib/toast";

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
      <ListExpenses />
      <BottomBar />
    </PersistQueryClientProvider>
  );
}

export default App;
