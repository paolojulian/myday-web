import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import "./App.css";
import { toast } from "./lib/toast";
import TodoList from "./components/list-todo/list-todo";
import BottomBar from "./components/bottom-bar/bottom-bar";

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
      <TodoList />
      <BottomBar />
    </PersistQueryClientProvider>
  );
}

export default App;
