import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Grid state (pagination, sorting, search and filters) mirrored into the URL so
 * list views are shareable and survive a reload.
 *
 * `filters` maps a name to either a default value or
 * `{ default, parse, serialize }` for filters whose URL form differs from their
 * state form (e.g. lowercase in the URL, uppercase in state).
 *
 * Only non-default values are written, keeping URLs clean.
 */
export default function useListState({
  sortBy,
  sortOrder = "asc",
  pageSize = 25,
  filters = {},
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Callers declare `filters` inline, so a new object identity arrives on every
  // render; key the memo off the filter names instead.
  const filterKey = Object.keys(filters).join(",");
  const defs = useMemo(
    () =>
      Object.entries(filters).map(([name, def]) => {
        const spec = def && typeof def === "object" ? def : { default: def };
        return {
          name,
          default: spec.default ?? "",
          parse: spec.parse ?? ((v) => v),
          serialize: spec.serialize ?? ((v) => v),
        };
      }),
    [filterKey],
  );

  const readFilters = useCallback(
    (params) =>
      Object.fromEntries(
        defs.map((d) => {
          const raw = params.get(d.name);
          return [d.name, raw == null ? d.default : d.parse(raw)];
        }),
      ),
    [defs],
  );

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filterValues, setFilterValues] = useState(() =>
    readFilters(searchParams),
  );
  const [paginationModel, setPaginationModel] = useState(() => ({
    page: Math.max(0, (Number(searchParams.get("page")) || 1) - 1),
    pageSize: Number(searchParams.get("pageSize")) || pageSize,
  }));
  const [sortModel, setSortModel] = useState(() => {
    const field = searchParams.get("sort") ?? sortBy;
    if (!field) return [];
    return [{ field, sort: searchParams.get("dir") ?? sortOrder }];
  });

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Adopt external URL changes (navbar deep links, back/forward) without
  // clobbering the updates this hook writes itself.
  const written = useRef("");
  useEffect(() => {
    if (searchParams.toString() === written.current) return;
    setFilterValues(readFilters(searchParams));
    setSearch(searchParams.get("q") ?? "");
    setDebouncedSearch(searchParams.get("q") ?? "");
    setPaginationModel({
      page: Math.max(0, (Number(searchParams.get("page")) || 1) - 1),
      pageSize: Number(searchParams.get("pageSize")) || pageSize,
    });
    const field = searchParams.get("sort") ?? sortBy;
    setSortModel(
      field ? [{ field, sort: searchParams.get("dir") ?? sortOrder }] : [],
    );
  }, [searchParams, readFilters, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    for (const d of defs) {
      const value = filterValues[d.name];
      if (value && value !== d.default) params.set(d.name, d.serialize(value));
    }
    if (paginationModel.page > 0) params.set("page", paginationModel.page + 1);
    if (paginationModel.pageSize !== pageSize)
      params.set("pageSize", paginationModel.pageSize);
    const sort = sortModel[0];
    if (sort && (sort.field !== sortBy || sort.sort !== sortOrder)) {
      params.set("sort", sort.field);
      params.set("dir", sort.sort);
    }

    const next = params.toString();
    if (next === searchParams.toString()) return;
    written.current = next;
    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    filterValues,
    paginationModel,
    sortModel,
    defs,
    pageSize,
    sortBy,
    sortOrder,
    searchParams,
    setSearchParams,
  ]);

  const toFirstPage = useCallback(
    () => setPaginationModel((prev) => ({ ...prev, page: 0 })),
    [],
  );

  const setFilter = useCallback(
    (name, value) => {
      setFilterValues((prev) => ({ ...prev, [name]: value }));
      toFirstPage();
    },
    [toFirstPage],
  );

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      toFirstPage();
    },
    [toFirstPage],
  );

  return {
    search,
    debouncedSearch,
    setSearch: handleSearchChange,
    filters: filterValues,
    setFilter,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
  };
}
