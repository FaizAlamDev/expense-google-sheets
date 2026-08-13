import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { toDateString, parseDateString } from "../utils/date";

type DatePickerProps = {
  date: string;
  onChange: (value: string) => void;
  slotsLoading: boolean;
};

export function DatePicker({ date, onChange, slotsLoading }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(toDateString(selectedDate));
    }
  };

  return (
    <View className="mb-3">
      <Text className="mb-1 font-medium">Date:</Text>
      <View className="flex-row items-center">
        <Pressable
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
          onPress={() => setShowPicker(true)}
        >
          <Text>{date || "Select date"}</Text>
        </Pressable>
        {slotsLoading && (
          <ActivityIndicator size="small" color="#2563eb" className="ml-2" />
        )}
      </View>

      {showPicker && (
        <DateTimePicker
          value={date ? parseDateString(date) : new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
