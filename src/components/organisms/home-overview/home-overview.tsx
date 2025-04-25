const HomeOverview = () => {
  return (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-4">
        <Item title="$9,000" subtitle="Remaining Budget" />
        <Item title="-$1,900" subtitle="Spent Today" />
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
