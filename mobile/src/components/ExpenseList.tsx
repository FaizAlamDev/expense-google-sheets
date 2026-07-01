import { View, Text, Pressable } from "react-native";
import type { Expense } from "../types";
import { ExpenseEntry } from "./ExpenseEntry";

type ExpenseListProps = {
  expenses: Expense[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Expense, value: string) => void;
  remainingSlots?: number;
};

export function ExpenseList({
  expenses,
  onAdd,
  onRemove,
  onUpdate,
  remainingSlots,
}: ExpenseListProps) {
  const maxReached = expenses.length >= (remainingSlots ?? 10);

  return (
    <View className="mb-3">
      {expenses.map((expense, index) => (
        <ExpenseEntry
          key={index}
          expense={expense}
          index={index}
          onUpdate={onUpdate}
          onRemove={onRemove}
          canRemove={expenses.length > 1}
        />
      ))}

      <View className="items-center mt-3">
        <Pressable
          onPress={onAdd}
          disabled={maxReached}
          className={`w-full px-4 py-2 rounded-md border items-center ${
            maxReached
              ? "border-gray-300 bg-gray-100"
              : "border-blue-500 bg-white"
          }`}
        >
          {remainingSlots !== undefined ? (
            maxReached ? (
              <Text className="text-gray-500">No slots remaining</Text>
            ) : (
              <Text className="text-blue-600 font-medium">
                Add Expense ({remainingSlots - expenses.length} slots left)
              </Text>
            )
          ) : (
            <Text className="text-blue-600 font-medium">Add Expense</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
