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
  let previous = -2;
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
    <nav aria-label="Expense pages">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            Previous
          </button>
        </li>
        {pageItems(page, pageCount).map((item, index) =>
          item === "…" ? (
            <li key={`gap-${index}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li
              key={item}
              className={`page-item ${item === page ? "active" : ""}`}
            >
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(item)}
              >
                {item + 1}
              </button>
            </li>
          )
        )}
        <li
          className={`page-item ${page === pageCount - 1 ? "disabled" : ""}`}
        >
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount - 1}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}