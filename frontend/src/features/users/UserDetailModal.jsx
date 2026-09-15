import { useState } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined,
  PersonOutline,
  MailOutline,
  CalendarTodayOutlined,
  ChevronRight,
  Inventory2Outlined,
} from "@mui/icons-material";
import { useUpdateUser, useDeleteUser } from "../../hooks/useUsers";
import { useNotification } from "../../context/NotificationContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoanDetailModal from "../loans/LoanDetailModal";
import { formatDate } from "../../utils/date";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "../../components/Dialog";

function InfoRow({ icon, label, value }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" noWrap title={value}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function UserDetailModal({ user, open, onClose }) {
  const { notify } = useNotification();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  if (!user) return null;

  const initials = (user.fullName || user.email || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isAdmin = user.role === "ADMIN";

  const handleToggleRole = async () => {
    const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";
    try {
      await updateUser.mutateAsync({ id: user.id, data: { role: newRole } });
      notify(`User role changed to ${newRole}`, "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to update role",
        "error",
      );
    }
  };

  const handleToggleActive = async () => {
    setDeactivateConfirm(false);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: { isActive: !user.isActive },
      });
      notify(user.isActive ? "User deactivated" : "User activated", "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to update user",
        "error",
      );
    }
  };

  const handleDelete = async () => {
    setDeleteConfirm(false);
    try {
      await deleteUser.mutateAsync(user.id);
      notify("User deleted", "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to delete user",
        "error",
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: isAdmin ? "secondary.main" : "primary.main",
                width: 52,
                height: 52,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap sx={{ lineHeight: 1.3 }}>
                {user.fullName || user.email}
              </Typography>
              <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={
                    isAdmin ? (
                      <AdminPanelSettingsOutlined fontSize="small" />
                    ) : (
                      <PersonOutline fontSize="small" />
                    )
                  }
                  label={isAdmin ? "Admin" : "Member"}
                  color={isAdmin ? "secondary" : "default"}
                  variant={isAdmin ? "filled" : "outlined"}
                />
                <Chip
                  size="small"
                  label={user.isActive ? "Active" : "Inactive"}
                  color={user.isActive ? "success" : "default"}
                  variant={user.isActive ? "filled" : "outlined"}
                  sx={
                    user.isActive
                      ? { bgcolor: "#ccfcd2", color: "#000" }
                      : undefined
                  }
                />
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "background.default",
              "& > *": { minWidth: 0 },
            }}
          >
            <InfoRow
              icon={<MailOutline fontSize="small" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<CalendarTodayOutlined fontSize="small" />}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
          </Box>

          {user.loans?.length > 0 && (
            <Box mb={1}>
              <Divider sx={{ mb: 1 }} />
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Active Loans ({user.loans.length})
              </Typography>
              <List dense disablePadding>
                {user.loans.map((loan) => (
                  <ListItemButton
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    sx={{ borderRadius: 2, px: 1 }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: "background.default",
                          color: "text.secondary",
                          width: 34,
                          height: 34,
                        }}
                      >
                        <Inventory2Outlined fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={loan.item?.name || loan.itemId}
                      secondary={`Due: ${formatDate(loan.dueDate)}`}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                    <ChevronRight sx={{ color: "text.disabled" }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="contained"
              onClick={handleToggleRole}
              disabled={updateUser.isPending}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {user.role === "ADMIN" ? "Make Member" : "Make Admin"}
            </Button>
            <Button
              variant="contained"
              color={user.isActive ? "warning" : "success"}
              onClick={() =>
                user.isActive
                  ? setDeactivateConfirm(true)
                  : handleToggleActive()
              }
              disabled={updateUser.isPending}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteConfirm(true)}
              disabled={deleteUser.isPending}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Delete
            </Button>
          </Stack>
          <Button onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />

      <ConfirmDialog
        open={deactivateConfirm}
        title="Deactivate User"
        message="Deactivating this user will prevent them from signing in. Continue?"
        onConfirm={handleToggleActive}
        onCancel={() => setDeactivateConfirm(false)}
        confirmColor="error"
        confirmText="Deactivate"
      />

      <LoanDetailModal
        loan={selectedLoan}
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        showAdminActions
      />
    </>
  );
}
