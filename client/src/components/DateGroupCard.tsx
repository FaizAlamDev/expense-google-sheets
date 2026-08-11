import { useState } from "react";
import type { ExpenseGroup, ExpenseRecord } from "../types";
import { ExpenseRow } from "./ExpenseRow";

type ExpensePatch = { name: string; amount: number };

type DateGroupCardProps = {
  group: ExpenseGroup;
  onUpdate: (id: number, patch: ExpensePatch) => void;
  onDelete: (id: number) => void;
  onAdd: (date: string, name: string, amount: number) => void;
};

const MAX_PER_DAY = 10;

export function DateGroupCard({
  group,
  onUpdate,
  onDelete,
  onAdd,
}: DateGroupCardProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const full = group.expenses.length >= MAX_PER_DAY;
  const total = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  const confirmAdd = () => {
    const amount = parseFloat(newAmount);
    const valid =
      newName.trim() &&
      /[A-Za-z]/.test(newName) &&
      Number.isFinite(amount) &&
      amount > 0;
    if (!valid) return;
    onAdd(group.date, newName.trim(), amount);
    setNewName("");
    setNewAmount("");
    setAdding(false);
  };

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>{group.date}</strong>
        <span className="text-muted">
          {group.expenses.length}/{MAX_PER_DAY} · Total{" "}
          <strong>{total.toFixed(2)}</strong>
        </span>
      </div>
      <div className="card-body">
        {group.expenses.length === 0 ? (
          <p className="text-muted mb-0">No expenses on this date.</p>
        ) : (
          group.expenses.map((expense: ExpenseRecord) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}

        {adding ? (
          <div className="row g-2 align-items-end mt-2">
            <div className="col-12 col-md-5">
              <label htmlFor={`new-name-${group.date}`} className="form-label">
                Name
              </label>
              <input
                id={`new-name-${group.date}`}
                type="text"
                className="form-control form-control-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                pattern=".*[A-Za-z].*"
                title="Name must contain at least one letter"
              />
            </div>
            <div className="col-12 col-md-4">
              <label
                htmlFor={`new-amount-${group.date}`}
                className="form-label"
              >
                Amount
              </label>
              <input
                id={`new-amount-${group.date}`}
                type="number"
                className="form-control form-control-sm"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min={0.01}
                step="0.01"
                title="Amount must be greater than 0"
              />
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={confirmAdd}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center mt-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={full}
              onClick={() => setAdding(true)}
            >
              {full ? "No slots remaining" : "Add Expense"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}