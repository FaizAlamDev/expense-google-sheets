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
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <h5 className="mb-3">Expense {index + 1}</h5>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <label htmlFor={`name-${index}`} className="form-label">
              Name
            </label>
            <input
              id={`name-${index}`}
              type="text"
              className="form-control"
              value={expense.name}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              required
              pattern=".*[A-Za-z].*"
              title="Name must contain atleast one letter"
            />
          </div>

          <div className="col-12 col-md-4">
            <label htmlFor={`amount-${index}`} className="form-label">
              Amount
            </label>
            <input
              id={`amount-${index}`}
              type="number"
              className="form-control"
              value={expense.amount}
              onChange={(e) => onUpdate(index, "amount", e.target.value)}
              required
              min={0.01}
              step="0.01"
              title="Amount must be greater than 0"
            />
          </div>

          {canRemove && (
            <div className="col-12 col-md-3 d-flex justify-content-md-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="btn btn-outline-danger w-100 w-md-auto"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
