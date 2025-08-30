type DatePickerProps = {
  date: string;
  onChange: (value: string) => void;
};

export function DatePicker({ date, onChange }: DatePickerProps) {
  return (
    <div>
      <label htmlFor="date">Date: </label>
      <input
        id="date"
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
