import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  QrCode as QrIcon,
} from "@mui/icons-material";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { TableSkeleton } from "../../components/PageSkeleton";
import CreateItemDialog from "../../features/items/CreateItemDialog";

export default function GearList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [createOpen, setCreateOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const category = searchParams.get("category") || "";
  const hasLoan = searchParams.get("hasLoan") || "";
  const hasQrTag = searchParams.get("hasQrTag") || "";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(category && { category }),
    ...(hasLoan && { hasLoan }),
    ...(hasQrTag && { hasQrTag }),
  };

  const { data, isLoading } = useItems(queryParams);

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  const columns = [
    { id: "name", label: "Name" },
    {
      id: "hasqr",
      sx: { px: 0 },
      render: (row) => row.qrTag && <QrIcon fontSize="small" />,
    },
    {
      id: "category",
      label: "Category",
      render: (row) => row.category?.name || "—",
    },
    { id: "shortId", label: "Short ID" },
    {
      id: "status",
      label: "Status",
      sortable: false,
      render: (row) => (
        <StatusBadge status={row.hasActiveLoan ? "CHECKED_OUT" : "AVAILABLE"} />
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
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

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
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
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
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
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Has QR Tag</InputLabel>
          <Select
            value={hasQrTag}
            onChange={(e) => updateParam("hasQrTag", e.target.value)}
            label="Has QR Tag"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Active Loan</InputLabel>
          <Select
            value={hasLoan}
            onChange={(e) => updateParam("hasLoan", e.target.value)}
            label="Active Loan"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Checked Out</MenuItem>
            <MenuItem value="false">Available</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState
          message={
            debouncedSearch ? `No items match your filters` : "No items found"
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data.data}
          totalCount={data.totalCount}
          page={page - 1}
          pageSize={pageSize}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={(p) => updateParam("page", String(p + 1))}
          onPageSizeChange={(ps) => {
            updateParam("pageSize", String(ps));
            updateParam("page", "1");
          }}
          onSortChange={(col, order) => {
            updateParam("sortBy", col);
            updateParam("sortOrder", order);
          }}
          onRowClick={(row) => navigate(`/admin/items/${row.shortId}`)}
        />
      )}

      <CreateItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(item) => navigate(`/admin/items/${item.shortId}`)}
      />
    </Container>
  );
}
