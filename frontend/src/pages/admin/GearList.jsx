import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../../hooks/useItems";
import { useCategories } from "../../hooks/useCategories";
import { Container, Typography, Box, Button } from "@mui/material";
import { Add as AddIcon, QrCode as QrIcon } from "@mui/icons-material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import EmptyState from "../../components/EmptyState";
import { TableSkeleton } from "../../components/PageSkeleton";
import CreateItemDialog from "../../features/items/CreateItemDialog";
import GearListToolbar from "../../features/items/GearListToolbar";

export default function GearList() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
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

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    categories,
    category,
    onCategoryChange: setCategory,
    hasQrTag,
    onHasQrTagChange: setHasQrTag,
    hasLoan,
    onHasLoanChange: setHasLoan,
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
            sortBy="name"
            sortOrder="asc"
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
