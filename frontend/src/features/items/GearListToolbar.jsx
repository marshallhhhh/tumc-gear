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

/**
 * Toolbar for the admin gear list: free-text search, resource filters
 * (inline on wide screens, in a popover below `custom_800`) and the
 * built-in DataGrid CSV/print export.
 */
export default function GearListToolbar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  hasQrTag,
  onHasQrTagChange,
  hasLoan,
  onHasLoanChange,
}) {
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const activeFilterCount = [category, hasQrTag, hasLoan].filter(
    Boolean,
  ).length;

  const renderFilterFields = (stacked) => (
    <>
      <FormControl
        size="small"
        fullWidth={stacked}
        sx={{ minWidth: stacked ? undefined : 150 }}
      >
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          label="Category"
        >
          <MenuItem value="">All</MenuItem>
          {categories?.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        size="small"
        fullWidth={stacked}
        sx={{ minWidth: stacked ? undefined : 130 }}
      >
        <InputLabel>Has QR Tag</InputLabel>
        <Select
          value={hasQrTag}
          onChange={(e) => onHasQrTagChange(e.target.value)}
          label="Has QR Tag"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </Select>
      </FormControl>
      <FormControl
        size="small"
        fullWidth={stacked}
        sx={{ minWidth: stacked ? undefined : 140 }}
      >
        <InputLabel>Active Loan</InputLabel>
        <Select
          value={hasLoan}
          onChange={(e) => onHasLoanChange(e.target.value)}
          label="Active Loan"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Checked Out</MenuItem>
          <MenuItem value="false">Available</MenuItem>
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
          sx={{ minWidth: 200 }}
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
              options={{ fileName: "gear" }}
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
