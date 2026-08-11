type DateSearchBarProps = {
  value: string;
  onChange: (date: string) => void;
  onClear: () => void;
};

export function DateSearchBar({ value, onChange, onClear }: DateSearchBarProps) {
  return (
    <div className="card p-3 shadow-sm mb-4">
      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-5">
          <label htmlFor="search-date" className="form-label">
            Search by date
          </label>
          <div className="d-flex gap-2">
            <input
              id="search-date"
              type="date"
              className="form-control"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            {value && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}