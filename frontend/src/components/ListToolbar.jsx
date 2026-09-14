import { useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
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
 * Shared toolbar for admin list pages: free-text search, optional resource
 * filters and the built-in DataGrid CSV/print export.
 *
 * Filters are supplied via `renderFilters(stacked)` which is called twice when
 * `collapsibleFilters` is set: once inline for wide screens (`stacked=false`)
 * and once inside a popover for narrow screens (`stacked=true`). When
 * `collapsibleFilters` is false the filters are always rendered inline.
 */
export default function ListToolbar({
  search,
  onSearchChange,
  renderFilters,
  activeFilterCount = 0,
  collapsibleFilters = true,
  exportFileName,
  showPrint = false,
  wrap = false,
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
          flexWrap: wrap ? "wrap" : undefined,
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

        {renderFilters && !collapsibleFilters && renderFilters(false)}

        {renderFilters && collapsibleFilters && (
          <>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {renderFilters(false)}
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
                {renderFilters(true)}
              </Stack>
            </Popover>
          </>
        )}

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
            {showPrint && (
              <ExportPrint
                render={<MenuItem />}
                onClick={() => setExportAnchorEl(null)}
              >
                Print
              </ExportPrint>
            )}
            <ExportCsv
              render={<MenuItem />}
              options={{ fileName: exportFileName }}
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
