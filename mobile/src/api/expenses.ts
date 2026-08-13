import Constants from "expo-constants";
import type {
  AdjustmentRecord,
  DatesPage,
  ExpenseGroup,
  ExpenseRecord,
  MonthsPage,
} from "../types";

const API_URL = Constants.expoConfig?.extra?.apiUrl as string | undefined;

async function live<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchDatesPage(
  limit: number,
  offset: number
): Promise<DatesPage> {
  return live<DatesPage>(
    `/api/expenses/dates?limit=${limit}&offset=${offset}`
  );
}

export async function fetchExpensesByDate(
  date: string
): Promise<ExpenseGroup> {
  return live<ExpenseGroup>(`/api/expenses?date=${encodeURIComponent(date)}`);
}

export async function createExpense(
  date: string,
  name: string,
  amount: number
): Promise<ExpenseRecord> {
  const created = await live<{ success: boolean; expenses: ExpenseRecord[] }>(
    "/api/expenses",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, expenses: [{ name, amount }] }),
    }
  );
  return created.expenses[0];
}

export async function updateExpense(
  id: number,
  patch: { name: string; amount: number }
): Promise<ExpenseRecord> {
  return live<ExpenseRecord>(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await live(`/api/expenses/${id}`, { method: "DELETE" });
}

export async function fetchMonthsPage(
  limit: number,
  offset: number
): Promise<MonthsPage> {
  return live<MonthsPage>(
    `/api/expenses/months?limit=${limit}&offset=${offset}`
  );
}

export async function createAdjustment(
  month: string,
  amount: number,
  label: string
): Promise<AdjustmentRecord> {
  return live<AdjustmentRecord>("/api/expenses/adjustments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, amount, label }),
  });
}

export async function updateAdjustment(
  id: number,
  patch: { amount: number; label: string }
): Promise<AdjustmentRecord> {
  return live<AdjustmentRecord>(`/api/expenses/adjustments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteAdjustment(id: number): Promise<void> {
  await live(`/api/expenses/adjustments/${id}`, { method: "DELETE" });
}