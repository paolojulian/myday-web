import { AppBottomSheet } from "@/components/atoms";
import { ComponentProps, FC, useEffect, useRef } from "react";
import { AddExpenseParams } from "../../../services/expense-service/expense.service";

type ModalExpenseAddProps = {
  onSubmit: (expenseToAdd: AddExpenseParams) => void;
} & Omit<ComponentProps<typeof AppBottomSheet>, "children">;

const ModalExpenseAdd: FC<ModalExpenseAddProps> = ({
  onSubmit,
  isOpen,
  ...props
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      title: formData.get("title") as string,
      amount: Number(formData.get("amount")),
      transaction_date: new Date(),
      description: formData.get("description") as string,
      category_id: null,
      recurrence: null,
      recurrence_id: null,
    });
  };

  useEffect(() => {
    formRef.current?.reset();
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <AppBottomSheet isOpen={isOpen} {...props}>
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* title */}
        <section>
          <label htmlFor="title">Title</label>
          <input ref={inputRef} type="text" id="title" name="title" />
        </section>
        {/* transaction amount */}
        <section>
          <label htmlFor="amount">Amount</label>
          <input ref={amountRef} type="number" id="amount" name="amount" />
        </section>
        {/* category */}
        <section></section>
        {/* description */}
        <section></section>

        {/* save */}
        <section>
          <button onClick={props.onClose} type="button">
            Cancel
          </button>
          <button type="submit">Save</button>
        </section>
      </form>
    </AppBottomSheet>
  );
};

export default ModalExpenseAdd;
