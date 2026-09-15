// Backend pagination cap (see backend/src/utils/pagination.js MAX_PAGE_SIZE).
export const PAGE_SIZE = 500;

// Hard ceiling on how many rows a list view will pull. Beyond this the result is
// flagged `truncated` so the UI can say so — never truncate silently.
export const MAX_FETCH_ALL_ROWS = 5000;

/**
 * Pages through a list endpoint until the whole set is retrieved.
 *
 * `fetcher(params)` must resolve to the standard list envelope
 * `{ data, page, pageSize, totalCount, totalPages }`.
 *
 * Pages after the first are requested concurrently. Because the table can change
 * between requests, rows are de-duplicated by `id` when concatenating.
 */
export async function fetchAllPages(fetcher, params = {}) {
  const first = await fetcher({ ...params, page: 1, pageSize: PAGE_SIZE });
  const totalCount = first.totalCount ?? first.data.length;

  const wanted = Math.min(totalCount, MAX_FETCH_ALL_ROWS);
  const lastPage = Math.ceil(wanted / PAGE_SIZE);

  let pages = [first.data];
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        fetcher({ ...params, page: i + 2, pageSize: PAGE_SIZE }),
      ),
    );
    pages = pages.concat(rest.map((r) => r.data));
  }

  const byId = new Map();
  for (const page of pages) {
    for (const row of page) byId.set(row.id, row);
  }

  return {
    data: [...byId.values()],
    totalCount,
    truncated: totalCount > MAX_FETCH_ALL_ROWS,
  };
}
