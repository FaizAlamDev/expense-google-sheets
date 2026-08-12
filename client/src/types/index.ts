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
