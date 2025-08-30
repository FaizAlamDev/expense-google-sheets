import { useState, type SyntheticEvent } from "react";
import type { Expense } from "./types";
import { Messages } from "./components/Messages";
import { DatePicker } from "./components/DatePicker";
import { ExpenseList } from "./components/ExpenseList";
import { SubmitButton } from "./components/SubmitButton";
import { Footer } from "./components/Footer";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { name: "", amount: "" },
  ]);
  const [date, setDate] = useState("");

  const [remainingSlots, setRemainingSlots] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const addExpense = () => {
    if (expenses.length < 10) {
      setExpenses([...expenses, { name: "", amount: "" }]);
    }
  };

  const removeExpense = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (
    index: number,
    field: keyof Expense,
    value: string
  ) => {
    const updatedExpenses = expenses.map((expense, i) =>
      i === index ? { ...expense, [field]: value } : expense
    );
    setExpenses(updatedExpenses);
  };

  async function logExpense(e: SyntheticEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          expenses: expenses.map((expense) => ({
            name: expense.name,
            amount: expense.amount,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      setDate("");
      setExpenses([{ name: "", amount: "" }]);
      setRemainingSlots(undefined);

      setSuccess("Expense logged successfully");
      setTimeout(() => {
        setSuccess("");
      }, 3000);

      return await response.json();
    } catch (err) {
      console.error(`Error submitting expense: ${err}`);
      setError(
        `Failed to log expense: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setTimeout(() => {
        setError("");
      }, 5000);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function findAvailableSlots(value: string) {
    setDate(value);
    const response = await fetch(
      `api/getAvailableSlots?date=${encodeURIComponent(value)}`
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch available slots");
    }
    setRemainingSlots(data.availableSlots);
  }

  return (
    <>
      <h1>Expense Logging App</h1>
      <div>
        <Messages error={error} success={success} />
        <form onSubmit={logExpense}>
          <DatePicker date={date} onChange={findAvailableSlots} />
          <ExpenseList
            expenses={expenses}
            onAdd={addExpense}
            onRemove={removeExpense}
            onUpdate={updateExpense}
            remainingSlots={remainingSlots}
          />
          <SubmitButton
            isLoading={isLoading}
            expenseCount={expenses.length}
            remainingSlots={remainingSlots}
          />
        </form>
      </div>
      <Footer />
    </>
  );
}

export default App;
