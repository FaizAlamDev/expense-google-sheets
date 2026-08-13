export interface Expense {
  name: string;
  amount: string;
}

export interface ExpenseRecord {
  id: number;
  date: string;
  name: string;
  amount: number;
}

export interface ExpenseGroup {
  date: string;
  expenses: ExpenseRecord[];
  total: number;
}

export interface DatesPage {
  total: number;
  dates: DateSummary[];
}

export interface DateSummary {
  date: string;
  count: number;
  total: number;
}

export interface AdjustmentRecord {
  id: number;
  month: string;
  amount: number;
  label: string | null;
}

export interface MonthSummary {
  month: string;
  dayTotal: number;
  adjustmentTotal: number;
  total: number;
  days: DateSummary[];
  adjustments: AdjustmentRecord[];
}

export interface MonthsPage {
  total: number;
  months: MonthSummary[];
}
