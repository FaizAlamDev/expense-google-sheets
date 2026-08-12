import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import type { DateSummary, ExpenseGroup } from "../types";
import {
  createExpense,
  deleteExpense,
  fetchDatesPage,
  fetchExpensesByDate,
  updateExpense,
} from "../api/expenses";
import { SearchDateBar } from "./SearchDateBar";
import { Pagination } from "./Pagination";
import { DateRow } from "./DateRow";
import { DateGroupCard } from "./DateGroupCard";

type ExpensePatch = { name: string; amount: number };

const PAGE_SIZE = 10;

export function HistoryScreen() {
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

  const refreshGroup = async (date: string) => {
    setGroup(await fetchExpensesByDate(date));
  };

  const handleUpdate = async (id: number, patch: ExpensePatch) => {
    try {
      await updateExpense(id, patch);
      refresh();
      if (group) await refreshGroup(group.date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      refresh();
      if (group) await refreshGroup(group.date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleAdd = async (date: string, name: string, amount: number) => {
    try {
      await createExpense(date, name, amount);
      refresh();
      await refreshGroup(date);
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

      {!searchDate && (
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" className="mt-8" />
      ) : summaries && summaries.length === 0 ? (
        <Text className="text-center text-gray-500 mt-8">No expenses yet.</Text>
      ) : summaries ? (
        <View className="mt-1">
          {summaries.map((summary) => (
            <DateRow
              key={summary.date}
              summary={summary}
              onOpen={() => openGroup(summary.date)}
            />
          ))}
        </View>
      ) : null}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View
          className="flex-1 justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="bg-white rounded-2xl"
            style={{ maxHeight: "85%", width: "100%" }}
          >
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
              <Text className="font-bold text-lg">{group?.date ?? "…"}</Text>
              <Pressable
                className="p-1"
                onPress={() => setModalOpen(false)}
                hitSlop={8}
              >
                <Text className="text-2xl text-gray-500 leading-none">×</Text>
              </Pressable>
            </View>
            <ScrollView className="px-4 pt-3 pb-4">
              {groupLoading || !group ? (
                <ActivityIndicator size="large" color="#0d6efd" className="py-8" />
              ) : (
                <DateGroupCard
                  group={group}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}