import { AppPageHeader } from "@/components/atoms/app-page-header";
import { HomeOverview, HomeRecentTransactions } from "@/components/organisms";
import { FC } from "react";

type HomeProps = object;

const Home: FC<HomeProps> = () => {
  return (
    <div>
      <section id="home-header">
        <AppPageHeader title={"My Day"} description={"April 25, 2025"} />
      </section>

      <section id="home-overview">
        <HomeOverview />
      </section>

      <section id="home-recent-transactions">
        <HomeRecentTransactions />
      </section>
    </div>
  );
};

export default Home;
