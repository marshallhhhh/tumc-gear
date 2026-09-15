import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import ListToolbar from "../../components/ListToolbar";
import StatusChip from "../../components/StatusChip";

const STATUS_OPTIONS = ["OPEN", "CLOSED"];

/**
 * Toolbar for the admin found-report list: free-text search, a status filter
 * and the built-in DataGrid CSV/print export.
 */
export default function FoundReportListToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      exportFileName="found-reports"
      showPrint
      wrap
      collapsibleFilters={false}
      activeFilterCount={status ? 1 : 0}
      renderFilters={() => (
        <FormControl size="small" sx={{ minWidth: 140 }}>
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
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                <StatusChip status={option} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    />
  );
}
