import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type SearchDateBarProps = {
  value: string;
  onChange: (date: string) => void;
  onClear: () => void;
};

export function SearchDateBar({ value, onChange, onClear }: SearchDateBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split("T")[0]);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow mb-4">
      <Text className="mb-1 font-medium">Search by date</Text>
      <View className="flex-row items-center">
        <Pressable
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
          onPress={() => setShowPicker(true)}
        >
          <Text className={value ? "" : "text-gray-400"}>
            {value || "Select date"}
          </Text>
        </Pressable>
        {value ? (
          <Pressable
            className="ml-2 border border-gray-400 rounded-md px-3 py-2"
            onPress={onClear}
          >
            <Text className="text-gray-600 font-medium">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}