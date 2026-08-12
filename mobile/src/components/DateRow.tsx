import { Pressable, Text, View } from "react-native";
import type { DateSummary } from "../types";

type DateRowProps = {
  summary: DateSummary;
  onOpen: () => void;
};

export function DateRow({ summary, onOpen }: DateRowProps) {
  return (
    <Pressable
      onPress={onOpen}
      className="flex-row justify-between items-center bg-white rounded-xl px-4 py-3 mb-2 border border-gray-100"
    >
      <View>
        <Text className="font-semibold text-base">{summary.date}</Text>
        <Text className="text-gray-500 text-sm">
          {summary.count} expense{summary.count === 1 ? "" : "s"}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="bg-gray-100 rounded-full px-3 py-1 font-bold text-lg">
          ₹{summary.total.toFixed(2)}
        </Text>
        <Text className="text-gray-400 text-xl">›</Text>
      </View>
    </Pressable>
  );
}