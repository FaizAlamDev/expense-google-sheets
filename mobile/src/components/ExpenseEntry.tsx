import { View, Text, TextInput, Pressable } from "react-native";
import type { Expense } from "../types";

type ExpenseEntryProps = {
  expense: Expense;
  index: number;
  onUpdate: (index: number, field: keyof Expense, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

export function ExpenseEntry({
  expense,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: ExpenseEntryProps) {
  return (
    <View className="bg-white rounded-lg shadow-sm mb-3">
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3">Expense {index + 1}</Text>

        <View className="flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0">
          <View className="flex-1">
            <Text className="mb-1 font-medium">Name</Text>
            <TextInput
              value={expense.name}
              onChangeText={(text) => onUpdate(index, "name", text)}
              placeholder="Enter name"
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            />
          </View>

          <View className="flex-1">
            <Text className="mb-1 font-medium">Amount</Text>
            <TextInput
              value={String(expense.amount)}
              onChangeText={(text) => onUpdate(index, "amount", text)}
              placeholder="Enter amount"
              keyboardType="numeric"
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            />
          </View>

          {canRemove && (
            <View className="flex-1 md:flex-none mt-2">
              <Pressable
                onPress={() => onRemove(index)}
                className="border border-red-500 rounded-md px-4 py-2 items-center"
              >
                <Text className="text-red-500 font-medium">Remove</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
