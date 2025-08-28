import { useState, type SyntheticEvent } from "react";
import type { Expense } from "./types";
import "./App.css";

function App() {
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([
    { name: "", amount: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setError("");
    setSuccess("");

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

  const remainingSlots = 10 - expenses.length;

  return (
    <>
      <h1>Expense Logging App</h1>
      <div>
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={logExpense}>
          <div>
            <label htmlFor="date">Date: </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {expenses.map((expense, index) => (
            <div key={index} className="expense-entry">
              <h3>Expense {index + 1}</h3>
              <div>
                <label htmlFor={`name-${index}`}>Name: </label>
                <input
                  id={`name-${index}`}
                  type="text"
                  value={expense.name}
                  onChange={(e) => updateExpense(index, "name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`amount-${index}`}>Amount: </label>
                <input
                  id={`amount-${index}`}
                  type="number"
                  value={expense.amount}
                  onChange={(e) =>
                    updateExpense(index, "amount", e.target.value)
                  }
                  required
                />
              </div>
              {expenses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExpense(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="add-expense-section">
            <button
              type="button"
              onClick={addExpense}
              disabled={expenses.length >= 10}
              className="add-btn"
            >
              Add Additional Expense ({remainingSlots} slots remaining)
            </button>
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading
              ? "Submitting..."
              : `Submit ${expenses.length} Expense${
                  expenses.length > 1 ? "s" : ""
                }`}
          </button>
        </form>
      </div>
      <footer>
        <p>Made by Faiz Alam</p>
      </footer>
    </>
  );
}

export default App;
