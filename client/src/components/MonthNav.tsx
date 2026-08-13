type MonthNavProps = {
  label: string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function MonthNav({
  label,
  page,
  pageCount,
  onPageChange,
}: MonthNavProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Month navigation" className="py-3">
      <div className="d-flex align-items-center justify-content-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary rounded-pill px-3"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          ‹ Prev
        </button>
        <span className="fw-semibold px-2">{label}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary rounded-pill px-3"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount - 1}
        >
          Next ›
        </button>
      </div>
    </nav>
  );
}