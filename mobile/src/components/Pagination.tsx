import { Pressable, ScrollView, Text, View } from "react-native";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function pageItems(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);

  const items = new Set<number>([
    0,
    count - 1,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...items]
    .filter((n) => n >= 0 && n < count)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let previous = -1;
  for (const n of sorted) {
    if (n - previous > 1) result.push("…");
    result.push(n);
    previous = n;
  }
  return result;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <View className="items-center mt-3 mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center"
      >
        <Pressable
          className={`border border-blue-200 rounded-full px-3 py-1.5 mr-2 ${
            page === 0 ? "opacity-40" : ""
          }`}
          disabled={page === 0}
          onPress={() => onPageChange(page - 1)}
        >
          <Text className="text-blue-700">‹ Prev</Text>
        </Pressable>

        {pageItems(page, pageCount).map((item, index) =>
          item === "…" ? (
            <View key={`gap-${index}`} className="mx-1">
              <Text className="text-gray-400">…</Text>
            </View>
          ) : (
            <Pressable
              key={item}
              className={`rounded-full px-3 py-1.5 mx-1 ${
                item === page ? "bg-blue-600" : "bg-gray-100"
              }`}
              onPress={() => onPageChange(item)}
            >
              <Text
                className={`font-medium ${
                  item === page ? "text-white" : "text-gray-700"
                }`}
              >
                {item + 1}
              </Text>
            </Pressable>
          )
        )}

        <Pressable
          className={`border border-blue-200 rounded-full px-3 py-1.5 ml-2 ${
            page === pageCount - 1 ? "opacity-40" : ""
          }`}
          disabled={page === pageCount - 1}
          onPress={() => onPageChange(page + 1)}
        >
          <Text className="text-blue-700">Next ›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}