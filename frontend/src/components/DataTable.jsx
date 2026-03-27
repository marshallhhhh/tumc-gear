import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
} from "@mui/material";

export default function DataTable({
  columns,
  rows,
  totalCount = 0,
  page = 0,
  pageSize = 50,
  sortBy,
  sortOrder = "asc",
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onRowClick,
  loading,
}) {
  const handleSort = (columnId) => {
    if (!onSortChange) return;
    const isAsc = sortBy === columnId && sortOrder === "asc";
    onSortChange(columnId, isAsc ? "desc" : "asc");
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table size="small" aria-busy={loading}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "background.default",
                    ...col.sx,
                  }}
                >
                  {col.sortable !== false && onSortChange ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : "asc"}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                hover={!!onRowClick}
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ color: "text.secondary", ...col.sx }}
                  >
                    {col.render ? col.render(row) : row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) =>
            onPageSizeChange?.(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
}
