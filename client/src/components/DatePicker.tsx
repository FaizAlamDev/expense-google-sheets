type DatePickerProps = {
  date: string;
  onChange: (value: string) => void;
};

export function DatePicker({ date, onChange }: DatePickerProps) {
  return (
    <div className="mb-3">
      <label htmlFor="date" className="form-label">
        Date:{" "}
      </label>
      <input
        id="date"
        type="date"
        className="form-control"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
