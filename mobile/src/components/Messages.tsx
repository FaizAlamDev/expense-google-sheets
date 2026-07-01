import { View, Text } from "react-native";

type MessageProps = {
  error: string;
  success: string;
};

export function Messages({ error, success }: MessageProps) {
  if (!error && !success) return null;

  return (
    <View className="mt-3 space-y-2">
      {success ? (
        <View className="bg-green-100 border border-green-400 rounded-md px-3 py-2">
          <Text className="text-green-700">{success}</Text>
        </View>
      ) : null}

      {error ? (
        <View className="bg-red-100 border border-red-400 rounded-md px-3 py-2">
          <Text className="text-red-700">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
