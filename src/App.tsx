import Categories from "@/pages/categories";
import ExpenseEdit from "@/pages/expense-edit";
import InvestmentAccounts from "@/pages/investment-accounts";
import Investments from "@/pages/investments";
import Settings from "@/pages/settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { AppSplashScreen } from "./components/atoms";
import MainLayout from "./components/layouts/main-layout";
import { useDexieSync } from "./hooks/use-dexie-sync";
import ExpenseAdd from "./pages/expense-add";
import Expenses from "./pages/expenses";
import Home from "./pages/home";

const client = new QueryClient();

function App() {
  const { isConnecting, syncEnabled } = useDexieSync();
  const showSplash = syncEnabled && isConnecting;

  return (
    <>
      <AppSplashScreen isLoading={showSplash} />

      {!showSplash && (
        <QueryClientProvider client={client}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="investments" element={<Investments />} />
              <Route path="categories" element={<Categories />} />
              <Route
                path="investment-accounts"
                element={<InvestmentAccounts />}
              />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/expenses">
              <Route path="add" element={<ExpenseAdd />} />
              <Route path=":id" element={<ExpenseEdit />} />
            </Route>
          </Routes>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
