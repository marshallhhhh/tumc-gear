import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import {
  Toolbar,
  ToolbarButton,
  ExportCsv,
  ExportPrint,
} from "@mui/x-data-grid";
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
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const activeFilterCount = [status, borrower].filter(Boolean).length;

  const renderFilterFields = (stacked) => (
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
    <Toolbar>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 1,
          width: "100%",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Search..."
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 50, flex: 1 }}
        />

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {renderFilterFields(false)}
        </Box>

        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            height: 40,
          }}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Stack sx={{ p: 2, gap: 2, minWidth: 220 }}>
            {renderFilterFields(true)}
          </Stack>
        </Popover>

        <Box sx={{ ml: "auto" }}>
          <Tooltip title="Export">
            <ToolbarButton onClick={(e) => setExportAnchorEl(e.currentTarget)}>
              <FileDownloadIcon fontSize="small" />
            </ToolbarButton>
          </Tooltip>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <ExportPrint
              render={<MenuItem />}
              onClick={() => setExportAnchorEl(null)}
            >
              Print
            </ExportPrint>
            <ExportCsv
              render={<MenuItem />}
              options={{ fileName: "loans" }}
              onClick={() => setExportAnchorEl(null)}
            >
              Download as CSV
            </ExportCsv>
          </Menu>
        </Box>
      </Box>
    </Toolbar>
  );
}
