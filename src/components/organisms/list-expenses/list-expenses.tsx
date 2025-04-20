import { useExpenses } from '../../../hooks/expenses/hooks/use-expenses';

export default function ListExpenses() {
  const { data, isLoading } = useExpenses();

  if (isLoading || !data) {
    return null;
  }

  const [expenses, error] = data;

  if (error) {
    return (
      <div>
        <p>Error loading expenses: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {expenses.map((expense) => (
        <div key={expense.id}>
          <p>{expense.title}</p>
        </div>
      ))}
    </div>
  );
}
