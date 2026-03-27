import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useUpdateUser, useDeleteUser } from "../../hooks/useUsers";
import { useNotification } from "../../context/NotificationContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoanDetailModal from "../loans/LoanDetailModal";
import { formatDate } from "../../utils/date";

export default function UserDetailModal({ user, open, onClose }) {
  const { notify } = useNotification();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  if (!user) return null;

  const handleToggleRole = async () => {
    const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";
    try {
      await updateUser.mutateAsync({ id: user.id, data: { role: newRole } });
      notify(`User role changed to ${newRole}`, "success");
      onClose();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update role", "error");
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
      notify(err.response?.data?.message || "Failed to update user", "error");
    }
  };

  const handleDelete = async () => {
    setDeleteConfirm(false);
    try {
      await deleteUser.mutateAsync(user.id);
      notify("User deleted", "success");
      onClose();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete user", "error");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{user.fullName || user.email}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Email: {user.email}</Typography>
          <Typography variant="body2">Role: {user.role}</Typography>
          <Typography variant="body2">
            Status: {user.isActive ? "Active" : "Inactive"}
          </Typography>
          <Typography variant="body2">
            Joined: {formatDate(user.createdAt)}
          </Typography>

          {user.loans?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Active Loans
              </Typography>
              <List dense>
                {user.loans.map((loan) => (
                  <ListItemButton
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <ListItemText
                      primary={loan.item?.name || loan.itemId}
                      secondary={`Due: ${formatDate(loan.dueDate)}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "flex-start",
            px: 3,
            pb: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleToggleRole}
            disabled={updateUser.isPending}
          >
            {user.role === "ADMIN" ? "Make Member" : "Make Admin"}
          </Button>
          <Button
            variant="outlined"
            color={user.isActive ? "warning" : "success"}
            onClick={() =>
              user.isActive ? setDeactivateConfirm(true) : handleToggleActive()
            }
            disabled={updateUser.isPending}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteConfirm(true)}
            disabled={deleteUser.isPending}
          >
            Delete
          </Button>
          <Box flexGrow={1} />
          <Button onClick={onClose}>Close</Button>
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
        confirmColor="warning"
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
