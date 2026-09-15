export const MAX_PAGE_SIZE = 100;

export function buildPaginationQuery({
  page = 1,
  pageSize = 50,
  maxPageSize = MAX_PAGE_SIZE,
  sortBy,
  sortOrder = "asc",
  allowedSortFields = [],
}) {
  const p = Math.max(1, Number(page));
  const resolvedMaxPageSize = Math.max(1, Number(maxPageSize));
  const ps = Math.min(resolvedMaxPageSize, Math.max(1, Number(pageSize)));
  const skip = (p - 1) * ps;

  let orderBy;
  if (sortBy && allowedSortFields.includes(sortBy)) {
    orderBy = { [sortBy]: sortOrder === "desc" ? "desc" : "asc" };
  }

  return { skip, take: ps, orderBy, page: p, pageSize: ps };
}

export function buildPaginationMeta(page, pageSize, totalCount) {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
