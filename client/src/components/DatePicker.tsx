type DatePickerProps = {
  date: string;
  onChange: (value: string) => void;
  slotsLoading: boolean;
};

export function DatePicker({ date, onChange, slotsLoading }: DatePickerProps) {
  return (
    <div className="mb-3">
      <label htmlFor="date" className="form-label">
        Date:{" "}
      </label>
      <div className="d-flex align-items-center">
        <input
          id="date"
          type="date"
          className="form-control"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        {slotsLoading && (
          <div
            className="spinner-border spinner-border-sm text-primary ms-2"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
