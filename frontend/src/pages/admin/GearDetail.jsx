import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useItem, useDeleteItem } from "../../hooks/useItems";

import { useNotification } from "../../context/NotificationContext";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DetailSkeleton } from "../../components/PageSkeleton";
import EditGearDialog from "../../features/items/EditGearDialog";
import QrTagSection from "../../features/items/QrTagSection";
import ActivityHistory from "../../features/items/ActivityHistory";
import LoanDetailModal from "../../features/loans/LoanDetailModal";
import {
  formatDate,
  formatDayOfWeekDate,
  formatDateTime,
} from "../../utils/date";

export default function GearDetail() {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useItem(shortId, { includeLoans: true, includeFoundReports: true });
  const deleteItem = useDeleteItem();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loanModal, setLoanModal] = useState(null);

  if (isLoading)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <DetailSkeleton />
      </Container>
    );
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error.response?.status === 404
            ? "Item not found"
            : "Failed to load item"}
        </Alert>
      </Container>
    );
  }

  const activeLoan = item?.loans?.find((l) => l.status === "ACTIVE");

  const handleDelete = async () => {
    setDeleteConfirm(false);
    try {
      await deleteItem.mutateAsync(item.id);
      notify("Item deleted", "success");
      navigate("/admin/items");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete item", "error");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header row: name left, edit/delete right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="h5">{item.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {item.shortId}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirm(true)}
            disabled={deleteItem.isPending}
          >
            Delete
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Top row: Gear Details (left) | QR Tag (right) */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Gear Details
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.category?.name || "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ textAlign: "right", maxWidth: "60%" }}
                >
                  {item.description || "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Serial Number
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.serialNumber || "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(item.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: "100%" }} elevation={2}>
            <QrTagSection item={item} onUpdated={refetch} />
          </Paper>
        </Grid>
      </Grid>

      {/* Current Loan — full width */}
      <Paper sx={{ p: 3, mt: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Current Loan
        </Typography>
        {activeLoan ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <StatusBadge status="ACTIVE" />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Loaned To
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ cursor: "pointer", textDecoration: "underline" }}
              >
                {activeLoan.user?.fullName || activeLoan.user?.email}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Checked Out
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatDateTime(activeLoan.checkoutDate)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                color={
                  new Date(activeLoan.dueDate) < new Date()
                    ? "error.main"
                    : "text.primary"
                }
              >
                {formatDayOfWeekDate(activeLoan.dueDate)}
                {new Date(activeLoan.dueDate) < new Date() && " (Overdue)"}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="md"
              sx={{ alignSelf: "flex-start", mt: 0.5 }}
              onClick={() =>
                setLoanModal({
                  ...activeLoan,
                  item: { id: item.id, name: item.name, shortId: item.shortId },
                })
              }
            >
              Manage Loan
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StatusBadge status="AVAILABLE" />
            <Typography variant="body2" color="text.secondary">
              Not currently on loan
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Activity History */}
      <Paper sx={{ mt: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom paddingTop={3} paddingLeft={3}>
          Activity History
        </Typography>
        <ActivityHistory item={item} />
      </Paper>

      {/* Edit Dialog */}
      <EditGearDialog
        item={item}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />

      <LoanDetailModal
        loan={loanModal}
        open={!!loanModal}
        onClose={() => {
          setLoanModal(null);
          refetch();
        }}
        showAdminActions
      />
    </Container>
  );
}
