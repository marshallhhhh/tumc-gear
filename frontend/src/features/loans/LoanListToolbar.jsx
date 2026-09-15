import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import ListToolbar from "../../components/ListToolbar";
import StatusChip from "../../components/StatusChip";

const STATUS_OPTIONS = ["ACTIVE", "OVERDUE", "RETURNED", "CANCELLED"];

/**
 * Toolbar for the admin loan list: free-text search, status and borrower
 * filters (inline on wide screens, in a popover below `md`) and the
 * built-in DataGrid CSV/print export.
 */
export default function LoanListToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  borrowers,
  borrower,
  onBorrowerChange,
}) {
  const activeFilterCount = [status, borrower].filter(Boolean).length;

  const renderFilters = (stacked) => (
    <>
      <FormControl
        size="small"
        fullWidth={stacked}
        sx={{ minWidth: stacked ? undefined : 150 }}
      >
        <InputLabel>Status</InputLabel>
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          label="Status"
          renderValue={(value) =>
            value ? (
              <StatusChip status={value} />
            ) : (
              <span style={{ color: "text.secondary" }}>All Statuses</span>
            )
          }
        >
          <MenuItem value="">All</MenuItem>
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              <StatusChip status={s} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        size="small"
        fullWidth={stacked}
        sx={{ minWidth: stacked ? undefined : 170 }}
      >
        <InputLabel>Borrower</InputLabel>
        <Select
          value={borrower}
          onChange={(e) => onBorrowerChange(e.target.value)}
          label="Borrower"
        >
          <MenuItem value="">All</MenuItem>
          {borrowers?.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      exportFileName="loans"
      showPrint
      wrap
      renderFilters={renderFilters}
      activeFilterCount={activeFilterCount}
    />
  );
}
