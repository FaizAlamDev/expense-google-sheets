import type { ExpenseRecord } from "../types";

const pad = (n: number) => String(n).padStart(2, "0");

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260812);

const NAMES = [
  "Groceries",
  "Lunch",
  "Dinner",
  "Coffee",
  "Transport",
  "Rent",
  "Electricity",
  "Movies",
  "Pharmacy",
  "Snacks",
  "Fuel",
  "Clothing",
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const mockStore: ExpenseRecord[] = [];
let nextId = 1;

const today = new Date();
today.setHours(0, 0, 0, 0);

for (let i = 0; i < 70 && mockStore.length < 500; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() - i);
  const dateStr = formatDate(date);

  if (mockStore.length > 0 && rand() < 0.12) continue;

  const todaysExpenses: ExpenseRecord[] = [];
  const count = 1 + Math.floor(rand() * 10);
  for (let j = 0; j < count; j++) {
    todaysExpenses.push({
      id: nextId++,
      date: dateStr,
      name: NAMES[Math.floor(rand() * NAMES.length)],
      amount: round2(rand() * 200 + 5),
    });
  }
  mockStore.push(...todaysExpenses);
}

nextId = mockStore.length === 0 ? 1 : mockStore[mockStore.length - 1].id + 1;

export function nextMockId(): number {
  return nextId++;
}