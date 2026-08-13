import { useState } from "react";
import type { AdjustmentRecord } from "../types";

type AdjustmentPatch = { amount: number; label: string };

type AdjustmentRowProps = {
  adjustment: AdjustmentRecord;
  onUpdate: (id: number, patch: AdjustmentPatch) => void;
  onDelete: (id: number) => void;
};

export function AdjustmentRow({
  adjustment,
  onUpdate,
  onDelete,
}: AdjustmentRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draftAmount, setDraftAmount] = useState(String(adjustment.amount));
  const [draftLabel, setDraftLabel] = useState(adjustment.label ?? "");

  const sign = adjustment.amount >= 0 ? "+" : "-";

  if (editing) {
    return (
      <div className="card mb-2">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-5">
              <label
                htmlFor={`edit-adj-amount-${adjustment.id}`}
                className="form-label"
              >
                Amount (negative subtracts)
              </label>
              <input
                id={`edit-adj-amount-${adjustment.id}`}
                type="number"
                className="form-control form-control-sm"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                step="0.01"
                title="Amount must be a non-zero number"
              />
            </div>
            <div className="col-12 col-md-4">
              <label
                htmlFor={`edit-adj-label-${adjustment.id}`}
                className="form-label"
              >
                Label
              </label>
              <input
                id={`edit-adj-label-${adjustment.id}`}
                type="text"
                className="form-control form-control-sm"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="e.g. round-off"
              />
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => {
                  const amount = parseFloat(draftAmount);
                  if (!Number.isFinite(amount) || amount === 0) return;
                  onUpdate(adjustment.id, {
                    amount,
                    label: draftLabel.trim() || "",
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
            Delete adjustment{" "}
            <strong>
              {sign}
              {Math.abs(adjustment.amount).toFixed(2)}
            </strong>
            {adjustment.label ? ` (${adjustment.label})` : ""}?
          </span>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => {
                onDelete(adjustment.id);
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
        <span className="me-2">
          {sign}
          {Math.abs(adjustment.amount).toFixed(2)}
        </span>
        <span className="text-muted">{adjustment.label}</span>
      </div>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => {
            setDraftAmount(String(adjustment.amount));
            setDraftLabel(adjustment.label ?? "");
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