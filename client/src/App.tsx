import { useState, type SyntheticEvent } from "react";
import "./App.css";

function App() {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  async function logExpense(e: SyntheticEvent) {
    e.preventDefault();
    setDate("");
    setName("");
    setAmount("");
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
      return await response.json();
    } catch (err) {
      console.error(`Error submitting expense: ${err}`);
      throw err;
    }
  }

  return (
    <>
      <h1>Expense Logging App</h1>
      <div>
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
          <button type="submit">Submit</button>
        </form>
      </div>
      <footer>
        <p>Made by Faiz Alam</p>
      </footer>
    </>
  );
}

export default App;
