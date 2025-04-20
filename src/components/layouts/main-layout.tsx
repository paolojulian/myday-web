import { FC } from 'react';
import { BottomBar } from '../organisms/bottom-bar';
import { Outlet } from 'react-router-dom';

type MainLayoutProps = object;

const MainLayout: FC<MainLayoutProps> = () => {
  return (
    <div>
      <Outlet />
      <BottomBar />
    </div>
  );
};

export default MainLayout;
