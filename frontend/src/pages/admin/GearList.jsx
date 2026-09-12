import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Popover,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCode as QrIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import EmptyState from "../../components/EmptyState";
import { TableSkeleton } from "../../components/PageSkeleton";
import CreateItemDialog from "../../features/items/CreateItemDialog";

export default function GearList() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [category, setCategory] = useState("");
  const [hasLoan, setHasLoan] = useState("");
  const [hasQrTag, setHasQrTag] = useState("");

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useItems({ pageSize: 500 });

  const allItems = useMemo(() => data?.data ?? [], [data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allItems.filter((item) => {
      if (category && item.category?.id !== category) return false;
      if (hasQrTag && Boolean(item.qrTag) !== (hasQrTag === "true"))
        return false;
      if (hasLoan && Boolean(item.hasActiveLoan) !== (hasLoan === "true"))
        return false;
      if (!term) return true;
      return (
        item.name?.toLowerCase().includes(term) ||
        item.shortId?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    });
  }, [allItems, search, category, hasQrTag, hasLoan]);

  const activeFilterCount = [category, hasQrTag, hasLoan].filter(
    Boolean,
  ).length;
  const filtersOpen = Boolean(filterAnchorEl);

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
          onChange={(e) => setCategory(e.target.value)}
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
          onChange={(e) => setHasQrTag(e.target.value)}
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
          onChange={(e) => setHasLoan(e.target.value)}
          label="Active Loan"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Checked Out</MenuItem>
          <MenuItem value="false">Available</MenuItem>
        </Select>
      </FormControl>
    </>
  );

  const columns = [
    { id: "name", label: "Name" },
    {
      id: "hasqr",
      width: 48,
      minWidth: 48,
      sortable: false,
      sx: { px: 0 },
      render: (row) => row.qrTag && <QrIcon fontSize="small" />,
    },
    {
      id: "category",
      label: "Category",
      value: (row) => row.category?.name ?? "",
      render: (row) => row.category?.name || "—",
    },
    { id: "shortId", label: "Short ID" },
    {
      id: "status",
      label: "Status",
      value: (row) => (row.hasActiveLoan ? "Checked out" : "Available"),
      render: (row) => (
        <StatusChip status={row.hasActiveLoan ? "CHECKED_OUT" : "AVAILABLE"} />
      ),
    },
  ];

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        mt: 2,
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexShrink={0}
      >
        <Typography variant="h4">Gear</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Add Gear
        </Button>
      </Box>

      <Box
        display="flex"
        gap={2}
        mb={2}
        flexWrap="wrap"
        flexShrink={0}
        alignItems="center"
      >
        <TextField
          placeholder="Search..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          sx={{ display: { xs: "none", custom_800: "flex" }, gap: 2, flexWrap: "wrap" }}
        >
          {renderFilterFields(false)}
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          sx={{
            display: { xs: "inline-flex", custom_800: "none" },
            height: 40,
          }}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
        <Popover
          open={filtersOpen}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Stack sx={{ p: 2, gap: 2, minWidth: 220 }}>
            {renderFilterFields(true)}
          </Stack>
        </Popover>
      </Box>

      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : !rows.length ? (
          <EmptyState
            message={
              allItems.length ? "No items match your filters" : "No items found"
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            sortBy="name"
            sortOrder="asc"
            fillHeight
            onRowClick={(row) => navigate(`/admin/items/${row.shortId}`)}
          />
        )}
      </Box>

      <CreateItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(item) => navigate(`/admin/items/${item.shortId}`)}
      />
    </Container>
  );
}
