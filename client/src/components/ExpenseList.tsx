import type { Expense } from "../types";
import { ExpenseEntry } from "./ExpenseEntry";

type ExpenseListProps = {
  expenses: Expense[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Expense, value: string) => void;
  remainingSlots?: number;
};

export function ExpenseList({
  expenses,
  onAdd,
  onRemove,
  onUpdate,
  remainingSlots,
}: ExpenseListProps) {
  return (
    <>
      {expenses.map((expense, index) => (
        <ExpenseEntry
          key={index}
          expense={expense}
          index={index}
          onUpdate={onUpdate}
          onRemove={onRemove}
          canRemove={expenses.length > 1}
        />
      ))}

      <div className="add-expense-section">
        <button
          type="button"
          onClick={onAdd}
          disabled={expenses.length >= (remainingSlots ?? 0)}
          className="add-btn"
        >
          {remainingSlots !== undefined
            ? `Add Additional Expense, ${
                remainingSlots - expenses.length
              } slots remaining`
            : "Add Additional Expense"}
        </button>
      </div>
    </>
  );
}
