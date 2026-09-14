import { useState } from "react";
import {
  Box,
  Button,
  Chip,
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

/**
 * Toolbar for the admin user list: free-text search, a role filter (inline
 * on wide screens, in a popover below `md`) and the built-in DataGrid
 * CSV/print export.
 */
export default function UserListToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
}) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const activeFilterCount = [role].filter(Boolean).length;

  const renderFilterFields = (stacked) => (
    <FormControl
      size="small"
      fullWidth={stacked}
      sx={{ minWidth: stacked ? undefined : 140 }}
    >
      <InputLabel>Role</InputLabel>
      <Select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        label="Role"
        renderValue={(value) =>
          value ? (
            <Chip
              label={value.charAt(0) + value.slice(1).toLowerCase()}
              size="small"
              color={value === "ADMIN" ? "primary" : "warning"}
              variant="outlined"
            />
          ) : (
            <span style={{ color: "text.secondary" }}>All Roles</span>
          )
        }
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="ADMIN"><Chip
              label="Admin"
              size="small"
              color="primary"
              variant="outlined"
            /></MenuItem>
        <MenuItem value="MEMBER"><Chip
              label="Member"
              size="small"
              color="warning"
              variant="outlined"
            /></MenuItem>
      </Select>
    </FormControl>
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
              options={{ fileName: "users" }}
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
