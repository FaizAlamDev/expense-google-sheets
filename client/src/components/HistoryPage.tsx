import { useCallback, useEffect, useRef, useState } from "react";
import type { DateSummary, ExpenseGroup } from "../types";
import {
  createExpense,
  deleteExpense,
  fetchDatesPage,
  fetchExpensesByDate,
  updateExpense,
} from "../api/expenses";
import { DateSearchBar } from "./DateSearchBar";
import { Pagination } from "./Pagination";
import { Messages } from "./Messages";
import { DateRow } from "./DateRow";
import { DateGroupCard } from "./DateGroupCard";
import "./history.css";

type ExpensePatch = { name: string; amount: number };

const PAGE_SIZE = 10;

export function HistoryPage() {
  const [page, setPage] = useState(0);
  const pageCacheRef = useRef<Map<number, DateSummary[]>>(new Map());

  const [pageDates, setPageDates] = useState<DateSummary[] | null>(null);
  const [pageTotal, setPageTotal] = useState(0);

  const [searchDate, setSearchDate] = useState("");
  const [searchGroup, setSearchGroup] = useState<ExpenseGroup | null>(null);

  const [group, setGroup] = useState<ExpenseGroup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageCount = Math.ceil(pageTotal / PAGE_SIZE);

  const loadPage = useCallback(async () => {
    setError("");
    const cached = pageCacheRef.current.get(page);
    if (cached) {
      setPageDates(cached);
      return;
    }

    setLoading(true);
    try {
      const datesPage = await fetchDatesPage(PAGE_SIZE, page * PAGE_SIZE);
      pageCacheRef.current.set(page, datesPage.dates);
      setPageDates(datesPage.dates);
      setPageTotal(datesPage.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [page]);

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
      loadPage();
    }
  }, [searchDate, loadPage]);

  const refresh = useCallback(() => {
    pageCacheRef.current.clear();
    if (searchDate) {
      loadSearch(searchDate);
    } else {
      loadPage();
    }
  }, [searchDate, loadPage, loadSearch]);

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

  const summaries: DateSummary[] | null = searchDate
    ? searchGroup
      ? [
          {
            date: searchGroup.date,
            count: searchGroup.expenses.length,
            total: searchGroup.total,
          },
        ]
      : null
    : pageDates;

  return (
    <>
      <h2 className="text-center mb-4">Expense History</h2>
      <DateSearchBar
        value={searchDate}
        onChange={handleSearch}
        onClear={handleClearSearch}
      />
      <Messages error={error} success="" />

      {!searchDate && (
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      )}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : summaries && summaries.length === 0 ? (
        <p className="text-center text-muted mt-4">No expenses yet.</p>
      ) : summaries ? (
        <div className="list-group shadow-sm rounded-3 py-2">
          {summaries.map((summary) => (
            <DateRow
              key={summary.date}
              summary={summary}
              onOpen={() => openGroup(summary.date)}
            />
          ))}
        </div>
      ) : null}

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