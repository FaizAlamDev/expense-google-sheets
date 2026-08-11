import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { ExpenseGroup, ExpenseRecord } from "../types";
import { ExpenseRow } from "./ExpenseRow";

type ExpensePatch = { name: string; amount: number };

type DateGroupCardProps = {
  group: ExpenseGroup;
  onUpdate: (id: number, patch: ExpensePatch) => void;
  onDelete: (id: number) => void;
  onAdd: (date: string, name: string, amount: number) => void;
};

const MAX_PER_DAY = 10;

export function DateGroupCard({
  group,
  onUpdate,
  onDelete,
  onAdd,
}: DateGroupCardProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const full = group.expenses.length >= MAX_PER_DAY;
  const total = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  const confirmAdd = () => {
    const amount = parseFloat(newAmount);
    const valid =
      newName.trim() &&
      /[A-Za-z]/.test(newName) &&
      Number.isFinite(amount) &&
      amount > 0;
    if (!valid) return;
    onAdd(group.date, newName.trim(), amount);
    setNewName("");
    setNewAmount("");
    setAdding(false);
  };

  return (
    <View className="bg-white rounded-2xl shadow-sm mb-3">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="font-bold">{group.date}</Text>
        <Text className="text-gray-500">
          {group.expenses.length}/{MAX_PER_DAY} · Total{" "}
          <Text className="font-bold">{total.toFixed(2)}</Text>
        </Text>
      </View>

      <View className="px-4 py-3">
        {group.expenses.length === 0 ? (
          <Text className="text-gray-400 mb-2">No expenses on this date.</Text>
        ) : (
          group.expenses.map((expense: ExpenseRecord) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}

        {adding ? (
          <View className="mt-2">
            <Text className="mb-1 font-medium">Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
            />
            <Text className="mb-1 font-medium">Amount</Text>
            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
            />
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 bg-green-600 rounded-md px-4 py-2 items-center"
                onPress={confirmAdd}
              >
                <Text className="text-white font-medium">Add</Text>
              </Pressable>
              <Pressable
                className="flex-1 border border-gray-400 rounded-md px-4 py-2 items-center"
                onPress={() => setAdding(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="items-center mt-2">
            <Pressable
              className={`w-full px-4 py-2 rounded-md border items-center ${
                full
                  ? "border-gray-300 bg-gray-100"
                  : "border-blue-500 bg-white"
              }`}
              disabled={full}
              onPress={() => setAdding(true)}
            >
              <Text
                className={
                  full ? "text-gray-500" : "text-blue-600 font-medium"
                }
              >
                {full ? "No slots remaining" : "Add Expense"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}