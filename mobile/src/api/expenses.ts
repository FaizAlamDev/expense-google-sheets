import Constants from "expo-constants";
import type { DatesPage, ExpenseGroup, ExpenseRecord } from "../types";
import { mockStore, nextMockId } from "./mockData";

const USE_MOCK = true;
const API_URL = Constants.expoConfig?.extra?.apiUrl as string | undefined;

async function live<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function distinctDates(): string[] {
  const seen = new Set<string>();
  for (const record of mockStore) seen.add(record.date);
  return [...seen].sort().reverse();
}

function selectGroup(date: string): ExpenseGroup {
  const expenses = mockStore
    .filter((r) => r.date === date)
    .map((r) => ({ ...r }));
  return {
    date,
    expenses,
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
  };
}

export async function fetchDatesPage(
  limit: number,
  offset: number
): Promise<DatesPage> {
  if (USE_MOCK) {
    const dates = distinctDates();
    return { dates: dates.slice(offset, offset + limit), total: dates.length };
  }
  return live<DatesPage>(
    `/api/expenses/dates?limit=${limit}&offset=${offset}`
  );
}

export async function fetchExpensesByDate(
  date: string
): Promise<ExpenseGroup> {
  if (USE_MOCK) return selectGroup(date);
  return live<ExpenseGroup>(`/api/expenses?date=${encodeURIComponent(date)}`);
}

export async function createExpense(
  date: string,
  name: string,
  amount: number
): Promise<ExpenseRecord> {
  if (USE_MOCK) {
    const record: ExpenseRecord = { id: nextMockId(), date, name, amount };
    mockStore.push(record);
    return { ...record };
  }
  await live("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, expenses: [{ name, amount }] }),
  });
  return { id: Date.now(), date, name, amount };
}

export async function updateExpense(
  id: number,
  patch: { name: string; amount: number }
): Promise<ExpenseRecord> {
  if (USE_MOCK) {
    const record = mockStore.find((r) => r.id === id);
    if (!record) throw new Error("Expense not found");
    record.name = patch.name;
    record.amount = patch.amount;
    return { ...record };
  }
  return live<ExpenseRecord>(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  if (USE_MOCK) {
    const index = mockStore.findIndex((r) => r.id === id);
    if (index !== -1) mockStore.splice(index, 1);
    return;
  }
  await live(`/api/expenses/${id}`, { method: "DELETE" });
}