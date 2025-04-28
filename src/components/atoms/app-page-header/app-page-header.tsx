type Props = {
  title: string;
  description: string;
};

export const AppPageHeader = ({ title, description }: Props) => {
  return (
    <div className="flex flex-row justify-between items-center">
      <div className="flex flex-col items-start">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <button aria-label="Open settings button">S</button>
    </div>
  );
};
