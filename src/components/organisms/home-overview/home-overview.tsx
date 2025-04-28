import { toCurrency } from "@/lib/currency.utils";
import { FC } from "react";

type Props = {
  remainingBudget: number | null | undefined;
  spentToday: number;
}

const HomeOverview: FC<Props> = ({ remainingBudget, spentToday }) => {
  return (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-4">
        {/* TODO: Add no remaining budget */}
        {remainingBudget ? <Item title={toCurrency(remainingBudget)} subtitle="Remaining Budget" /> : null}
        <Item title={`${-toCurrency(spentToday)}`} subtitle="Spent Today" />
      </div>
    </div>
  );
};

const Item = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
  // TODO: add icon
}) => {
  return (
    <div className="w-full p-4 py-8 flex flex-col rounded-2xl border items-center text-center">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
};

export default HomeOverview;
