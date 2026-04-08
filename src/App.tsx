import { Route, Routes } from 'react-router-dom';
import './App.css';
import { AppSplashScreen } from './components/atoms';
import MainLayout from './components/layouts/main-layout';
import { useDexieSync } from './hooks/use-dexie-sync';
import ExpenseAdd from './pages/expense-add';
import Expenses from './pages/expenses';
import Home from './pages/home';
import ExpenseEdit from '@/pages/expense-edit';
import Categories from '@/pages/categories';
import Settings from '@/pages/settings';

function App() {
  const { isConnecting, syncEnabled } = useDexieSync();
  const showSplash = syncEnabled && isConnecting;

  return (
    <>
      <AppSplashScreen isLoading={showSplash} />

      {!showSplash && (
        <Routes>
          <Route path='/' element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path='expenses' element={<Expenses />} />
            <Route path='categories' element={<Categories />} />
            <Route path='settings' element={<Settings />} />
          </Route>
          <Route path='/expenses'>
            <Route path='add' element={<ExpenseAdd />} />
            <Route path=':id' element={<ExpenseEdit />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

export default App;
