import { FC } from "react";
import { Outlet } from "react-router-dom";
import { BottomBar } from "@/components/organisms/bottom-bar";

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
