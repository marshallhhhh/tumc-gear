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
export default function LoanListToolbar({
  search,
  onSearchChange,
}) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

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
