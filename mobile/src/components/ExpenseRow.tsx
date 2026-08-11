import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { ExpenseRecord } from "../types";

type ExpensePatch = { name: string; amount: number };

type ExpenseRowProps = {
  expense: ExpenseRecord;
  onUpdate: (id: number, patch: ExpensePatch) => void;
  onDelete: (id: number) => void;
};

export function ExpenseRow({ expense, onUpdate, onDelete }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draftName, setDraftName] = useState(expense.name);
  const [draftAmount, setDraftAmount] = useState(String(expense.amount));

  if (editing) {
    return (
      <View className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
        <View className="flex-col">
          <Text className="mb-1 font-medium">Name</Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
          />
          <Text className="mb-1 font-medium">Amount</Text>
          <TextInput
            value={draftAmount}
            onChangeText={setDraftAmount}
            keyboardType="numeric"
            className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
          />
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 bg-green-600 rounded-md px-4 py-2 items-center"
              onPress={() => {
                const amount = parseFloat(draftAmount);
                const valid =
                  draftName.trim() &&
                  /[A-Za-z]/.test(draftName) &&
                  Number.isFinite(amount) &&
                  amount > 0;
                if (!valid) return;
                onUpdate(expense.id, { name: draftName.trim(), amount });
                setEditing(false);
              }}
            >
              <Text className="text-white font-medium">Save</Text>
            </Pressable>
            <Pressable
              className="flex-1 border border-gray-400 rounded-md px-4 py-2 items-center"
              onPress={() => setEditing(false)}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (confirmingDelete) {
    return (
      <View className="bg-red-50 rounded-lg border border-red-300 p-3 mb-2">
        <Text className="mb-2 text-red-700">
          Delete {expense.name} ({expense.amount.toFixed(2)})?
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 bg-red-600 rounded-md px-4 py-2 items-center"
            onPress={() => {
              onDelete(expense.id);
              setConfirmingDelete(false);
            }}
          >
            <Text className="text-white font-medium">Delete</Text>
          </Pressable>
          <Pressable
            className="flex-1 border border-gray-400 rounded-md px-4 py-2 items-center"
            onPress={() => setConfirmingDelete(false)}
          >
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <View className="flex-row flex-1">
        <Text className="font-medium mr-2">{expense.name}</Text>
        <Text className="text-gray-500">{expense.amount.toFixed(2)}</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          className="border border-blue-500 rounded-md px-3 py-1"
          onPress={() => {
            setDraftName(expense.name);
            setDraftAmount(String(expense.amount));
            setEditing(true);
          }}
        >
          <Text className="text-blue-600 text-sm">Edit</Text>
        </Pressable>
        <Pressable
          className="border border-red-500 rounded-md px-3 py-1"
          onPress={() => setConfirmingDelete(true)}
        >
          <Text className="text-red-500 text-sm">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}