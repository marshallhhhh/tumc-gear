import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";
import useListState from "../../hooks/useListState";
import { Container, Typography, Box, Button } from "@mui/material";
import { Add as AddIcon, QrCode as QrIcon } from "@mui/icons-material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import EmptyState from "../../components/EmptyState";
import TruncationAlert from "../../components/TruncationAlert";
import { TableSkeleton } from "../../components/PageSkeleton";
import CreateItemDialog from "../../features/items/CreateItemDialog";
import GearListToolbar from "../../features/items/GearListToolbar";

export default function GearList() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [createOpen, setCreateOpen] = useState(false);

  const {
    search,
    debouncedSearch,
    setSearch,
    filters,
    setFilter,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
  } = useListState({
    sortBy: "name",
    sortOrder: "asc",
    filters: { category: "", hasQrTag: "", hasLoan: "" },
  });

  // The whole list is fetched once (paged through server-side); the grid then
  // sorts, filters and paginates it client-side without further requests.
  const { data, isLoading, isFetching } = useAllItems();

  const allItems = useMemo(() => data?.data ?? [], [data]);

  const { category, hasQrTag, hasLoan } = filters;

  const rows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
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
        item.serialNumber?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    });
  }, [allItems, debouncedSearch, category, hasQrTag, hasLoan]);

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    categories,
    category,
    onCategoryChange: (value) => setFilter("category", value),
    hasQrTag,
    onHasQrTagChange: (value) => setFilter("hasQrTag", value),
    hasLoan,
    onHasLoanChange: (value) => setFilter("hasLoan", value),
  };

  const columns = [
    { id: "name", label: "Name" },
    {
      id: "hasqr",
      width: 38,
      minWidth: 38,
      sortable: false,
      sx: {
        px: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
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
        mt: 2,
        p: 0,
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

      {data?.truncated && <TruncationAlert totalCount={data.totalCount} />}

      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : !allItems.length ? (
          <EmptyState message="No items found" />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={isFetching}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            toolbar={GearListToolbar}
            toolbarProps={toolbarProps}
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
