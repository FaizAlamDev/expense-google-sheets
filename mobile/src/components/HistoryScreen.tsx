import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import type { ExpenseGroup } from "../types";
import {
  createExpense,
  deleteExpense,
  fetchDatesPage,
  fetchExpensesByDate,
  updateExpense,
} from "../api/expenses";
import { DateGroupCard } from "./DateGroupCard";
import { SearchDateBar } from "./SearchDateBar";
import { Pagination } from "./Pagination";

type ExpensePatch = { name: string; amount: number };

type PageCacheEntry = {
  count: number;
  groups: ExpenseGroup[];
};

const PAGE_SIZE = 10;

export function HistoryScreen() {
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

  const showEmpty =
    !loading && !searchDate && pageEntries && pageEntries.count === 0;

  return (
    <View>
      <Text className="text-xl font-bold mb-4 text-center">
        Expense History
      </Text>

      <SearchDateBar
        value={searchDate}
        onChange={handleSearch}
        onClear={handleClearSearch}
      />

      {error ? (
        <View className="bg-red-100 border border-red-400 rounded-md px-3 py-2 mb-3">
          <Text className="text-red-700">{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0d6efd"
          className="mt-8"
        />
      ) : showEmpty ? (
        <Text className="text-center text-gray-500 mt-8">No expenses yet.</Text>
      ) : searchDate && searchGroup ? (
        <DateGroupCard
          group={searchGroup}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ) : pageEntries ? (
        <>
          {pageEntries.groups.length > 0 && (
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          )}
          {pageEntries.groups.map((group) => (
            <DateGroupCard
              key={group.date}
              group={group}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))}
        </>
      ) : null}
    </View>
  );
}