import { Route, Routes } from 'react-router-dom';
import './App.css';
import { AppSplashScreen } from './components/atoms';
import MainLayout from './components/layouts/main-layout';
import { AuthModal } from './components/organisms/auth-modal/auth-modal';
import { useDexieSync } from './hooks/use-dexie-sync';
import ExpenseAdd from './pages/expense-add';
import Expenses from './pages/expenses';
import Home from './pages/home';
import ExpenseEdit from '@/pages/expense-edit';
import Categories from '@/pages/categories';

function App() {
  const {
    isInitialSync,
    isConnecting,
    hasError,
    errorMessage,
    isAuthenticated,
  } = useDexieSync();
  const showSplash = isInitialSync && isConnecting;

  if (hasError && errorMessage) {
    console.warn('Dexie Cloud Sync Error:', errorMessage);
  }

  return (
    <>
      {!isAuthenticated && (
        <AuthModal
          onAuthenticated={() => {
            console.log('User authenticated successfully');
          }}
        />
      )}

      <AppSplashScreen isLoading={showSplash} />

      {!showSplash && isAuthenticated && (
        <Routes>
          <Route path='/' element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path='expenses' element={<Expenses />} />
            <Route path='categories' element={<Categories />} />
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
