type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function pageItems(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);

  const items = new Set<number>([
    0,
    count - 1,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...items]
    .filter((n) => n >= 0 && n < count)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let previous = -1;
  for (const n of sorted) {
    if (n - previous > 1) result.push("…");
    result.push(n);
    previous = n;
  }
  return result;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Expense pages" className="py-3">
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary rounded-pill px-3"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          ‹ Prev
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="text-secondary px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${
                item === page ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item + 1}
            </button>
          )
        )}
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