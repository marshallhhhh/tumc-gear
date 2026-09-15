import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Client-side table wrapper around MUI DataGrid. Sorting, filtering and
 * pagination are handled by the grid itself — pass the full row set once and
 * let the user slice it without further network/DB round-trips.
 *
 * Pagination and sorting are uncontrolled by default (seeded from `pageSize` /
 * `sortBy` / `sortOrder`). Pass `paginationModel` / `sortModel` together with
 * their change handlers to drive them from outside, e.g. from the URL.
 *
 * Column shape: { id, label, render?, value?, type?, sortable?, filterable?, sx? }
 * `value(row)` supplies the raw value used for sorting/filtering/quick search
 * when `render` produces non-textual content.
 */
export default function DataTable({
  columns,
  rows,
  loading,
  onRowClick,
  paginated = true,
  pageSize = 25,
  sortBy,
  sortOrder = "asc",
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  showToolbar = false,
  toolbar,
  toolbarProps,
  getRowId,
}) {
  const columnSx = {};
  const gridColumns = columns.map((col) => {
    if (col.sx) columnSx[`& [data-field="${col.id}"]`] = col.sx;
    const sortable = col.sortable !== false;
    return {
      field: col.id,
      headerName: col.label ?? "",
      width: col.width ?? 160,
      minWidth: col.minWidth ?? 120,
      flex: col.flex,
      type: col.type,
      sortable,
      filterable: col.filterable ?? sortable,
      valueGetter: col.value ? (_value, row) => col.value(row) : undefined,
      renderCell: col.render ? (params) => col.render(params.row) : undefined,
    };
  });

  // The community DataGrid always paginates, so "unpaginated" means one page
  // large enough to hold every row — otherwise rows silently disappear.
  const paginationProps = paginated
    ? { pageSizeOptions: PAGE_SIZE_OPTIONS }
    : {
        hideFooter: true,
        pageSizeOptions: [Math.max(rows.length, 1)],
        paginationModel: { page: 0, pageSize: Math.max(rows.length, 1) },
      };

  const controlledProps = {};
  if (paginated && paginationModel) {
    controlledProps.paginationModel = paginationModel;
    controlledProps.onPaginationModelChange = onPaginationModelChange;
  }
  if (sortModel) {
    controlledProps.sortModel = sortModel;
    controlledProps.onSortModelChange = onSortModelChange;
  }

  const initialState = {
    sorting:
      sortBy && !sortModel
        ? { sortModel: [{ field: sortBy, sort: sortOrder }] }
        : undefined,
    pagination:
      paginated && !paginationModel
        ? { paginationModel: { pageSize } }
        : undefined,
  };

  return (
    <Paper
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        mb: 2,
      }}
    >
      <DataGrid
        rows={rows}
        columns={gridColumns}
        getRowId={getRowId}
        loading={loading}
        density="compact"
        disableColumnMenu
        disableRowSelectionOnClick
        showToolbar={showToolbar || Boolean(toolbar)}
        slots={toolbar ? { toolbar } : undefined}
        slotProps={
          toolbar && toolbarProps ? { toolbar: toolbarProps } : undefined
        }
        initialState={initialState}
        sortingOrder={["asc", "desc"]}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        {...paginationProps}
        {...controlledProps}
        sx={{
          minHeight: 0,
          border: 0,
          "--DataGrid-containerBackground": (theme) =>
            theme.palette.background.default,
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
          },
          "& .MuiDataGrid-cell": {
            color: "text.secondary",
          },
          "& .MuiDataGrid-row": onRowClick ? { cursor: "pointer" } : undefined,
          "& .MuiDataGrid-footerContainer": {
            borderTop: 1,
            borderColor: "divider",
          },
          ...columnSx,
        }}
      />
    </Paper>
  );
}
