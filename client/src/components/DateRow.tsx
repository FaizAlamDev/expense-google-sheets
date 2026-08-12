import type { DateSummary } from "../types";

type DateRowProps = {
  summary: DateSummary;
  onOpen: () => void;
};

export function DateRow({ summary, onOpen }: DateRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
    >
      <div>
        <div className="fw-semibold">{summary.date}</div>
        <div className="text-secondary small">
          {summary.count} expense{summary.count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span
          className="badge rounded-pill text-bg-light border px-3 py-2 fs-6 fw-semibold"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          ₹{summary.total.toFixed(2)}
        </span>
        <span className="text-secondary">›</span>
      </div>
    </button>
  );
}