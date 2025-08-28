import { useState, type SyntheticEvent } from "react";
import "./App.css";

function App() {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          expenses: [
            {
              name,
              amount,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      setDate("");
      setName("");
      setAmount("");

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
          <div>
            <label htmlFor="name">Name: </label>
            <input
              id="name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="amount">Amount: </label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
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
