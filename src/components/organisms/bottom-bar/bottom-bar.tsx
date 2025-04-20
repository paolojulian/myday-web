import { useCreateExpense } from "../../../hooks/expenses/hooks/use-create-expense";
import AppButton from "../../atoms/app-button";

export default function BottomBar() {
  const createExpense = useCreateExpense();

  const handleClickAdd = () => {
    createExpense.mutate({
      amount: 100,
      title: "Test",
      transaction_date: new Date(),
      description: "Testing Description",
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    })

    // TODO: open modal
  }

  return (
    <div
      id="bottom-bar"
      className='fixed bottom-4 inset-x-4 z-(--z-bottom-bar) h-16 rounded-full overflow-hidden'
    >
      <div className='border border-black w-full h-full rounded-full'>
        <AppButton onClick={handleClickAdd} className="h-full aspect-square rounded-full border border-black active:scale-95 transition-colors">
          +
        </AppButton>
      </div>
    </div>
  );
}
