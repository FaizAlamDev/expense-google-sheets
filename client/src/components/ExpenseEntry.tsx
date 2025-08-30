import type { Expense } from "../types";

type ExpenseEntryProps = {
  expense: Expense;
  index: number;
  onUpdate: (index: number, field: keyof Expense, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

export function ExpenseEntry({
  expense,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: ExpenseEntryProps) {
  return (
    <div className="expense-entry">
      <h3>Expense {index + 1}</h3>

      <div>
        <label htmlFor={`name-${index}`}>Name: </label>
        <input
          id={`name-${index}`}
          type="text"
          value={expense.name}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor={`amount-${index}`}>Amount: </label>
        <input
          id={`amount-${index}`}
          type="number"
          value={expense.amount}
          onChange={(e) => onUpdate(index, "amount", e.target.value)}
          required
        />
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="remove-btn"
        >
          Remove
        </button>
      )}
    </div>
  );
}
