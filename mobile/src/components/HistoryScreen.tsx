import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
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
import { SearchDateBar } from "./SearchDateBar";
import { MonthNav } from "./MonthNav";
import { DateRow } from "./DateRow";
import { DateGroupCard } from "./DateGroupCard";
import { AdjustmentRow } from "./AdjustmentRow";

type ExpensePatch = { name: string; amount: number };
type AdjustmentPatch = { amount: number; label: string };

export function HistoryScreen() {
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

  const loadMonth = useCallback(async (target: number) => {
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
  }, []);

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

  const inSearch = searchDate !== "";
  const searchSummaries: DateSummary[] | null = searchGroup
    ? [
        {
          date: searchGroup.date,
          count: searchGroup.expenses.length,
          total: searchGroup.total,
        },
      ]
    : null;

  return (
    <View>
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

      {inSearch ? (
        loading ? (
          <ActivityIndicator size="large" color="#0d6efd" className="mt-8" />
        ) : searchGroup && searchGroup.expenses.length === 0 ? (
          <Text className="text-center text-gray-500 mt-8">
            No expenses on {searchGroup.date}.
          </Text>
        ) : searchSummaries ? (
          <View className="mt-1">
            {searchSummaries.map((summary) => (
              <DateRow
                key={summary.date}
                summary={summary}
                onOpen={() => openGroup(summary.date)}
              />
            ))}
          </View>
        ) : null
      ) : loading ? (
        <ActivityIndicator size="large" color="#0d6efd" className="mt-8" />
      ) : month ? (
        <>
          <MonthNav
            label={monthName(month.month)}
            page={page}
            pageCount={pageCount}
            onPageChange={handlePageChange}
          />

          <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-lg">{monthName(month.month)}</Text>
              <Text className="text-gray-500">
                Grand Total{" "}
                <Text className="font-bold">₹{month.total.toFixed(2)}</Text>
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">
                Dated: ₹{month.dayTotal.toFixed(2)}
              </Text>
              <Text className="text-gray-500 text-sm">
                Adjustments: ₹{month.adjustmentTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <Text className="font-bold mb-2">Days</Text>
            {month.days.length === 0 ? (
              <Text className="text-gray-400">No expenses this month.</Text>
            ) : (
              <View className="mt-1">
                {month.days.map((summary) => (
                  <DateRow
                    key={summary.date}
                    summary={summary}
                    onOpen={() => openGroup(summary.date)}
                  />
                ))}
              </View>
            )}
          </View>

          <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold">Adjustments</Text>
              <Pressable
                className="border border-blue-500 rounded-md px-3 py-1"
                onPress={() => setAddingAdjustment((v) => !v)}
              >
                <Text className="text-blue-600 text-sm">
                  {addingAdjustment ? "Cancel" : "Add adjustment"}
                </Text>
              </Pressable>
            </View>

            {addingAdjustment && (
              <View className="mb-3">
                <Text className="mb-1 font-medium">
                  Amount (negative subtracts)
                </Text>
                <TextInput
                  value={newAdjAmount}
                  onChangeText={setNewAdjAmount}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
                />
                <Text className="mb-1 font-medium">Label</Text>
                <TextInput
                  value={newAdjLabel}
                  onChangeText={setNewAdjLabel}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
                  placeholder="e.g. round-off"
                />
                <Pressable
                  className="bg-green-600 rounded-md px-4 py-2 items-center"
                  onPress={confirmAddAdjustment}
                >
                  <Text className="text-white font-medium">Add</Text>
                </Pressable>
              </View>
            )}

            {month.adjustments.length === 0 ? (
              <Text className="text-gray-400">
                No adjustments this month.
              </Text>
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
          </View>
        </>
      ) : (
        <Text className="text-center text-gray-500 mt-8">No expenses yet.</Text>
      )}

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