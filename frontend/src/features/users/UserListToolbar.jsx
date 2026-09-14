import { useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import { Search as SearchIcon, FileDownload as FileDownloadIcon } from "@mui/icons-material";
import {
  Toolbar,
  ToolbarButton,
  ExportCsv,
  ExportPrint,
} from "@mui/x-data-grid";

/**
 * Toolbar for the admin user list: free-text search, an inline role filter
 * and the built-in DataGrid CSV/print export.
 */
export default function UserListToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
}) {
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

        <FormControl size="small" sx={{ minWidth: 140 }}>
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
            <MenuItem value="ADMIN">
              <Chip label="Admin" size="small" color="primary" variant="outlined" />
            </MenuItem>
            <MenuItem value="MEMBER">
              <Chip label="Member" size="small" color="warning" variant="outlined" />
            </MenuItem>
          </Select>
        </FormControl>

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
