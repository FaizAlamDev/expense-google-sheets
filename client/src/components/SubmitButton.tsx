type SubmitButtonProps = {
  isLoading: boolean;
  expenseCount: number;
  remainingSlots?: number;
};

export function SubmitButton({
  isLoading,
  expenseCount,
  remainingSlots,
}: SubmitButtonProps) {
  return (
    <button type="submit" disabled={isLoading || !remainingSlots}>
      {isLoading
        ? "Submitting..."
        : `Submit ${expenseCount} Expense${expenseCount > 1 ? "s" : ""}`}
    </button>
  );
}
