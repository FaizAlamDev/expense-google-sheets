import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { AdjustmentRecord } from "../types";

type AdjustmentPatch = { amount: number; label: string };

type AdjustmentRowProps = {
  adjustment: AdjustmentRecord;
  onUpdate: (id: number, patch: AdjustmentPatch) => void;
  onDelete: (id: number) => void;
};

export function AdjustmentRow({
  adjustment,
  onUpdate,
  onDelete,
}: AdjustmentRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [draftAmount, setDraftAmount] = useState(String(adjustment.amount));
  const [draftLabel, setDraftLabel] = useState(adjustment.label ?? "");

  const sign = adjustment.amount >= 0 ? "+" : "-";

  if (editing) {
    return (
      <View className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
        <View className="flex-col">
          <Text className="mb-1 font-medium">
            Amount (negative subtracts)
          </Text>
          <TextInput
            value={draftAmount}
            onChangeText={setDraftAmount}
            keyboardType="numeric"
            className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
          />
          <Text className="mb-1 font-medium">Label</Text>
          <TextInput
            value={draftLabel}
            onChangeText={setDraftLabel}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white mb-2"
            placeholder="e.g. round-off"
          />
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 bg-green-600 rounded-md px-4 py-2 items-center"
              onPress={() => {
                const amount = parseFloat(draftAmount);
                if (!Number.isFinite(amount) || amount === 0) return;
                onUpdate(adjustment.id, {
                  amount,
                  label: draftLabel.trim() || "",
                });
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
          Delete adjustment {sign}
          {Math.abs(adjustment.amount).toFixed(2)}
          {adjustment.label ? ` (${adjustment.label})` : ""}?
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 bg-red-600 rounded-md px-4 py-2 items-center"
            onPress={() => {
              onDelete(adjustment.id);
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
        <Text className="font-medium mr-2">
          {sign}
          {Math.abs(adjustment.amount).toFixed(2)}
        </Text>
        <Text className="text-gray-500">{adjustment.label}</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          className="border border-blue-500 rounded-md px-3 py-1"
          onPress={() => {
            setDraftAmount(String(adjustment.amount));
            setDraftLabel(adjustment.label ?? "");
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