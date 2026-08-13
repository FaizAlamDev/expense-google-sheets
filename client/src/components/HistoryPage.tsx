import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdjustmentRecord,
  DateSummary,
  ExpenseGroup,
  MonthSummary,
} from "../types";
import {
  createAdjustment,
  createExpense,
  deleteAdjustment,
  deleteExpense,
  fetchExpensesByDate,
  fetchMonthsPage,
  updateAdjustment,
  updateExpense,
} from "../api/expenses";
import { DateSearchBar } from "./DateSearchBar";
import { MonthNav } from "./MonthNav";
import { Messages } from "./Messages";
import { DateRow } from "./DateRow";
import { DateGroupCard } from "./DateGroupCard";
import { AdjustmentRow } from "./AdjustmentRow";
import "./history.css";

type ExpensePatch = { name: string; amount: number };
type AdjustmentPatch = { amount: number; label: string };

export function HistoryPage() {
  const [page, setPage] = useState(0);
  const pageCacheRef = useRef<Map<number, MonthSummary>>(new Map());

  const [month, setMonth] = useState<MonthSummary | null>(null);
  const [pageTotal, setPageTotal] = useState(0);

  const [searchDate, setSearchDate] = useState("");
  const [searchGroup, setSearchGroup] = useState<ExpenseGroup | null>(null);

  const [group, setGroup] = useState<ExpenseGroup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  const [addingAdjustment, setAddingAdjustment] = useState(false);
  const [newAdjAmount, setNewAdjAmount] = useState("");
  const [newAdjLabel, setNewAdjLabel] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageCount = pageTotal;

  const monthName = useCallback((ym: string) => {
    const [year, monthNum] = ym.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(new Date(year, monthNum - 1, 1));
  }, []);

  const loadMonth = useCallback(
    async (target: number) => {
      setError("");
      const cached = pageCacheRef.current.get(target);
      if (cached) {
        setMonth(cached);
        return;
      }

      setLoading(true);
      try {
        const monthsPage = await fetchMonthsPage(1, target);
        const first = monthsPage.months[0];
        if (first) {
          pageCacheRef.current.set(target, first);
          setMonth(first);
        } else {
          setMonth(null);
        }
        setPageTotal(monthsPage.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load month");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadSearch = useCallback(async (date: string) => {
    setError("");
    setLoading(true);
    try {
      setSearchGroup(await fetchExpensesByDate(date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load date");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchDate) {
      loadMonth(page);
    }
  }, [searchDate, page, loadMonth]);

  const refresh = useCallback(() => {
    pageCacheRef.current.clear();
    if (searchDate) {
      loadSearch(searchDate);
    } else {
      loadMonth(page);
    }
  }, [searchDate, page, loadMonth, loadSearch]);

  const handleSearch = (date: string) => {
    setSearchDate(date);
    if (date) {
      loadSearch(date);
    }
  };

  const handleClearSearch = () => {
    setSearchDate("");
    setSearchGroup(null);
  };

  const handlePageChange = (next: number) => {
    if (next >= 0 && next < pageCount) {
      setPage(next);
    }
  };

  const openGroup = useCallback(async (date: string) => {
    setError("");
    setGroup(null);
    setModalOpen(true);
    setGroupLoading(true);
    try {
      setGroup(await fetchExpensesByDate(date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load date");
      setModalOpen(false);
    } finally {
      setGroupLoading(false);
    }
  }, []);

  const handleUpdate = async (id: number, patch: ExpensePatch) => {
    try {
      await updateExpense(id, patch);
      refresh();
      if (group) setGroup(await fetchExpensesByDate(group.date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      refresh();
      if (group) setGroup(await fetchExpensesByDate(group.date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleAdd = async (date: string, name: string, amount: number) => {
    try {
      await createExpense(date, name, amount);
      refresh();
      if (group) setGroup(await fetchExpensesByDate(date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    }
  };

  const confirmAddAdjustment = async () => {
    const amount = parseFloat(newAdjAmount);
    if (!Number.isFinite(amount) || amount === 0 || !month) return;
    try {
      await createAdjustment(month.month, amount, newAdjLabel.trim());
      setNewAdjAmount("");
      setNewAdjLabel("");
      setAddingAdjustment(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add adjustment");
    }
  };

  const handleUpdateAdjustment = async (id: number, patch: AdjustmentPatch) => {
    try {
      await updateAdjustment(id, patch);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update adjustment");
    }
  };

  const handleDeleteAdjustment = async (id: number) => {
    try {
      await deleteAdjustment(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete adjustment");
    }
  };

  const searchSummaries: DateSummary[] | null = searchGroup
    ? [
        {
          date: searchGroup.date,
          count: searchGroup.expenses.length,
          total: searchGroup.total,
        },
      ]
    : null;

  const inSearch = searchDate !== "";

  return (
    <>
      <DateSearchBar
        value={searchDate}
        onChange={handleSearch}
        onClear={handleClearSearch}
      />
      <Messages error={error} success="" />

      {inSearch ? (
        loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : searchGroup && searchGroup.expenses.length === 0 ? (
          <p className="text-center text-muted mt-4">
            No expenses on {searchGroup.date}.
          </p>
        ) : searchSummaries ? (
          <div className="list-group shadow-sm rounded-3 py-2">
            {searchSummaries.map((summary) => (
              <DateRow
                key={summary.date}
                summary={summary}
                onOpen={() => openGroup(summary.date)}
              />
            ))}
          </div>
        ) : null
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : month ? (
        <>
          <MonthNav
            label={monthName(month.month)}
            page={page}
            pageCount={pageCount}
            onPageChange={handlePageChange}
          />

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">{monthName(month.month)}</h5>
                <span className="text-muted">
                  Grand Total{" "}
                  <strong>₹{month.total.toFixed(2)}</strong>
                </span>
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>
                  Dated: ₹{month.dayTotal.toFixed(2)}
                </span>
                <span>
                  Adjustments: ₹{month.adjustmentTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <strong>Days</strong>
            </div>
            <div className="card-body">
              {month.days.length === 0 ? (
                <p className="text-muted mb-0">No expenses this month.</p>
              ) : (
                <div className="list-group rounded-3 py-2">
                  {month.days.map((summary) => (
                    <DateRow
                      key={summary.date}
                      summary={summary}
                      onOpen={() => openGroup(summary.date)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Adjustments</strong>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setAddingAdjustment((v) => !v)}
              >
                {addingAdjustment ? "Cancel" : "Add adjustment"}
              </button>
            </div>
            <div className="card-body">
              {addingAdjustment && (
                <div className="row g-2 align-items-end mb-3">
                  <div className="col-12 col-md-5">
                    <label htmlFor="new-adj-amount" className="form-label">
                      Amount (negative subtracts)
                    </label>
                    <input
                      id="new-adj-amount"
                      type="number"
                      className="form-control form-control-sm"
                      value={newAdjAmount}
                      onChange={(e) => setNewAdjAmount(e.target.value)}
                      step="0.01"
                      title="Amount must be a non-zero number"
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label htmlFor="new-adj-label" className="form-label">
                      Label
                    </label>
                    <input
                      id="new-adj-label"
                      type="text"
                      className="form-control form-control-sm"
                      value={newAdjLabel}
                      onChange={(e) => setNewAdjLabel(e.target.value)}
                      placeholder="e.g. round-off"
                    />
                  </div>
                  <div className="col-12 col-md-3 d-flex justify-content-md-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={confirmAddAdjustment}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
              {month.adjustments.length === 0 ? (
                <p className="text-muted mb-0">No adjustments this month.</p>
              ) : (
                month.adjustments.map((adjustment: AdjustmentRecord) => (
                  <AdjustmentRow
                    key={adjustment.id}
                    adjustment={adjustment}
                    onUpdate={handleUpdateAdjustment}
                    onDelete={handleDeleteAdjustment}
                  />
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-muted mt-4">No expenses yet.</p>
      )}

      {modalOpen && (
        <div className="history-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="history-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <h5 className="mb-0">{group?.date ?? "Loading…"}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
              />
            </div>
            <div className="history-modal-body">
              {groupLoading || !group ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <DateGroupCard
                  group={group}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}