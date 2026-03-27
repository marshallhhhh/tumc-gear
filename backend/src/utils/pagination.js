export function buildPaginationQuery({
  page = 1,
  pageSize = 50,
  sortBy,
  sortOrder = "asc",
  allowedSortFields = [],
}) {
  const p = Math.max(1, Number(page));
  const ps = Math.min(100, Math.max(1, Number(pageSize)));
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
