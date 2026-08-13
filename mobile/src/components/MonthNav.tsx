import { Pressable, Text, View } from "react-native";

type MonthNavProps = {
  label: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function MonthNav({
  label,
  page,
  pageCount,
  onPageChange,
}: MonthNavProps) {
  if (pageCount <= 1) return null;

  return (
    <View className="flex-row items-center justify-center my-2">
      <Pressable
        className={`border border-blue-200 rounded-full px-4 py-1.5 mr-2 ${
          page === 0 ? "opacity-40" : ""
        }`}
        disabled={page === 0}
        onPress={() => onPageChange(page - 1)}
      >
        <Text className="text-blue-700">‹ Prev</Text>
      </Pressable>
      <Text className="font-semibold mx-2">{label}</Text>
      <Pressable
        className={`border border-blue-200 rounded-full px-4 py-1.5 ml-2 ${
          page === pageCount - 1 ? "opacity-40" : ""
        }`}
        disabled={page === pageCount - 1}
        onPress={() => onPageChange(page + 1)}
      >
        <Text className="text-blue-700">Next ›</Text>
      </Pressable>
    </View>
  );
}