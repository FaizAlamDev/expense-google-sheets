import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import type { Expense } from "./types";

import { Messages } from "./components/Messages";
import { DatePicker } from "./components/DatePicker";
import { ExpenseList } from "./components/ExpenseList";
import { SubmitButton } from "./components/SubmitButton";
import { Footer } from "./components/Footer";

WebBrowser.maybeCompleteAuthSession();

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { name: "", amount: "" },
  ]);
  const [date, setDate] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/api/checkAuth`);
        const data = await response.json();

        if (!data.authenticated) {
          const redirectUri = AuthSession.makeRedirectUri({
            scheme: "expenseSheetsApp",
          });

          const authUrl = `${API_URL}/auth?platform=mobile`;
          const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            redirectUri
          );

          if (result.type === "success" && result.url) {
            const parsed = Linking.parse(result.url);

            const verify = await fetch(`${API_URL}/api/checkAuth`);
            const verifyData = await verify.json();
            if (!cancelled && verifyData.authenticated) {
              setCheckingAuth(false);
            }
          } else {
            console.warn("Auth flow was cancelled or failed:", result.type);
          }
          return;
        }

        if (!cancelled) {
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function logExpense() {
    if (!date || expenses.some((e) => !e.name.trim() || !e.amount.trim())) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    const nameRegex = /[A-Za-z]/;
    if (expenses.some((e) => !nameRegex.test(e.name))) {
      Alert.alert("Validation Error", "Name must contain at least one letter.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setTimeout(() => setSuccess(""), 3000);

      return await response.json();
    } catch (err) {
      console.error(`Error submitting expense: ${err}`);
      setError(
        `Failed to log expense: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setTimeout(() => setError(""), 5000);
      Alert.alert("Error", "Failed to log expense");
    } finally {
      setIsLoading(false);
    }
  }

  async function findAvailableSlots(value: string) {
    try {
      setDate(value);
      setSlotsLoading(true);

      const response = await fetch(
        `${API_URL}/api/getAvailableSlots?date=${encodeURIComponent(value)}`
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch available slots");

      setRemainingSlots(data.availableSlots);
    } catch (err) {
      console.error("Failed to fetch slots", err);
      setRemainingSlots(undefined);
    } finally {
      setSlotsLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0d6efd" />
        <Text className="mt-2 text-gray-600">Checking authentication...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerClassName="flex-grow px-4 py-6">
        <Text className="text-2xl font-bold mb-4 text-center">
          Expense Logging App
        </Text>

        <Messages error={error} success={success} />

        <View className="bg-white rounded-2xl p-4 shadow">
          <DatePicker
            date={date}
            onChange={findAvailableSlots}
            slotsLoading={slotsLoading}
          />
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
            onPress={logExpense}
          />
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}
