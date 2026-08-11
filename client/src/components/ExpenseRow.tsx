import { useState } from "react";
import type { ExpenseRecord } from "../types";

type ExpensePatch = { name: string; amount: number };

type ExpenseRowProps = {
  expense: ExpenseRecord;
  onUpdate: (id: number, patch: ExpensePatch) => void;
  onDelete: (id: number) => void;
};

export function ExpenseRow({ expense, onUpdate, onDelete }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draftName, setDraftName] = useState(expense.name);
  const [draftAmount, setDraftAmount] = useState(String(expense.amount));

  if (editing) {
    return (
      <div className="card mb-2">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-5">
              <label htmlFor={`edit-name-${expense.id}`} className="form-label">
                Name
              </label>
              <input
                id={`edit-name-${expense.id}`}
                type="text"
                className="form-control form-control-sm"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                pattern=".*[A-Za-z].*"
                title="Name must contain at least one letter"
              />
            </div>
            <div className="col-12 col-md-4">
              <label
                htmlFor={`edit-amount-${expense.id}`}
                className="form-label"
              >
                Amount
              </label>
              <input
                id={`edit-amount-${expense.id}`}
                type="number"
                className="form-control form-control-sm"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                min={0.01}
                step="0.01"
                title="Amount must be greater than 0"
              />
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => {
                  const amount = parseFloat(draftAmount);
                  const valid =
                    draftName.trim() && /[A-Za-z]/.test(draftName) &&
                    Number.isFinite(amount) &&
                    amount > 0;
                  if (!valid) return;
                  onUpdate(expense.id, {
                    name: draftName.trim(),
                    amount,
                  });
                  setEditing(false);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (confirmingDelete) {
    return (
      <div className="card mb-2 border-danger">
        <div className="card-body py-2 d-flex justify-content-between align-items-center">
          <span>
            Delete <strong>{expense.name}</strong> ({expense.amount.toFixed(2)})?
          </span>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => {
                onDelete(expense.id);
                setConfirmingDelete(false);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <div>
        <span className="me-2">{expense.name}</span>
        <span className="text-muted">{expense.amount.toFixed(2)}</span>
      </div>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            setDraftName(expense.name);
            setDraftAmount(String(expense.amount));
            setEditing(true);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}