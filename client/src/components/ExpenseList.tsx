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
    <div className="mb-3">
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

      <div className="d-flex justify-content-center mt-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={expenses.length >= (remainingSlots ?? 10)}
          className="btn btn-outline-primary w-100"
        >
          {remainingSlots !== undefined ? (
            expenses.length >= remainingSlots ? (
              <span className="text-muted">No slots remaining</span>
            ) : (
              `Add Expense (${remainingSlots - expenses.length} slots left)`
            )
          ) : (
            "Add Expense"
          )}
        </button>
      </div>
    </div>
  );
}
