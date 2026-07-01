import { Pressable, Text } from "react-native";

type SubmitButtonProps = {
  isLoading: boolean;
  expenseCount: number;
  remainingSlots?: number;
  onPress: () => void;
};

export function SubmitButton({
  isLoading,
  expenseCount,
  remainingSlots,
  onPress,
}: SubmitButtonProps) {
  const disabled = isLoading || !remainingSlots;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !remainingSlots}
      className={`mt-3 px-4 py-2 rounded-md items-center ${
        disabled ? "bg-gray-300" : "bg-green-600"
      }`}
    >
      <Text
        className={`font-medium ${disabled ? "text-gray-500" : "text-white"}`}
      >
        {isLoading
          ? "Submitting..."
          : `Submit ${expenseCount} Expense${expenseCount > 1 ? "s" : ""}`}
      </Text>
    </Pressable>
  );
}
