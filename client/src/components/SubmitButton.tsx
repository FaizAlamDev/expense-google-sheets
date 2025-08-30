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
    <button
      type="submit"
      className="btn btn-success mt-3"
      disabled={isLoading || !remainingSlots}
    >
      {isLoading
        ? "Submitting..."
        : `Submit ${expenseCount} Expense${expenseCount > 1 ? "s" : ""}`}
    </button>
  );
}
