import { useCallback, useEffect, useRef, useState } from "react";
import type { ExpenseGroup } from "../types";
import {
  createExpense,
  deleteExpense,
  fetchDatesPage,
  fetchExpensesByDate,
  updateExpense,
} from "../api/expenses";
import { DateGroupCard } from "./DateGroupCard";
import { DateSearchBar } from "./DateSearchBar";
import { Pagination } from "./Pagination";
import { Messages } from "./Messages";

type ExpensePatch = { name: string; amount: number };

type PageCacheEntry = {
  count: number;
  groups: ExpenseGroup[];
};

const PAGE_SIZE = 10;

export function HistoryPage() {
  const [page, setPage] = useState(0);
  const pageCacheRef = useRef<Map<number, PageCacheEntry>>(new Map());

  const [pageEntries, setPageEntries] = useState<PageCacheEntry | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [searchGroup, setSearchGroup] = useState<ExpenseGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageCount = pageEntries ? Math.ceil(pageEntries.count / PAGE_SIZE) : 0;

  const loadPage = useCallback(async () => {
    setError("");
    const cached = pageCacheRef.current.get(page);
    if (cached) {
      setPageEntries(cached);
      return;
    }

    setLoading(true);
    try {
      const datesPage = await fetchDatesPage(PAGE_SIZE, page * PAGE_SIZE);
      const groups = await Promise.all(
        datesPage.dates.map((date) => fetchExpensesByDate(date))
      );
      const next: PageCacheEntry = { count: datesPage.total, groups };
      pageCacheRef.current.set(page, next);
      setPageEntries(next);
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

  const handleUpdate = async (id: number, patch: ExpensePatch) => {
    try {
      await updateExpense(id, patch);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleAdd = async (date: string, name: string, amount: number) => {
    try {
      await createExpense(date, name, amount);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    }
  };

  const showSearch = Boolean(searchDate);
  const showList = !searchDate;

  return (
    <>
      <h2 className="text-center mb-4">Expense History</h2>
      <DateSearchBar
        value={searchDate}
        onChange={handleSearch}
        onClear={handleClearSearch}
      />
      <Messages error={error} success="" />

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : showSearch && searchGroup ? (
        <DateGroupCard
          group={searchGroup}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ) : showList && pageEntries && pageEntries.count === 0 ? (
        <p className="text-center text-muted">No expenses yet.</p>
      ) : (
        showList &&
        pageEntries && (
          <>
            {pageEntries.groups.map((group) => (
              <DateGroupCard
                key={group.date}
                group={group}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAdd={handleAdd}
              />
            ))}
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </>
        )
      )}
    </>
  );
}