import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import ListToolbar from "../../components/ListToolbar";

/**
 * Toolbar for the admin gear list: free-text search, resource filters
 * (inline on wide screens, in a popover below `md`) and the built-in
 * DataGrid CSV export.
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
  const activeFilterCount = [category, hasQrTag, hasLoan].filter(
    Boolean,
  ).length;

  const renderFilters = (stacked) => (
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
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      exportFileName="gear"
      renderFilters={renderFilters}
      activeFilterCount={activeFilterCount}
    />
  );
}
