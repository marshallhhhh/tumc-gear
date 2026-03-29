import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Divider,
} from "@mui/material";
import StatusBadge from "../../components/StatusBadge";
import LocationMinimap from "../../components/LocationMinimap";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  useReturnLoan,
  useCancelLoan,
  useExtendLoan,
} from "../../hooks/useLoans";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime, formatDayOfWeekDate } from "../../utils/date";

const isOverdue = (loan) =>
  loan.status === "ACTIVE" &&
  new Date(loan.dueDate) < new Date(new Date().toDateString());

export default function LoanDetailModal({
  loan,
  open,
  onClose,
  showAdminActions = false,
}) {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const returnLoan = useReturnLoan();
  const cancelLoan = useCancelLoan();
  const extendLoan = useExtendLoan();
  const { getLocation, loading: locationLoading } = useGeolocation();

  const [extendDays, setExtendDays] = useState(7);
  const [showExtend, setShowExtend] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);

  if (!loan) return null;

  const loanStatus = isOverdue(loan) ? "OVERDUE" : loan.status;
  const isActive = loan.status === "ACTIVE";
  const isOwnLoan = loan.userId === user?.id;

  const handleReturn = async () => {
    setConfirmReturn(false);
    try {
      if (showAdminActions && !isOwnLoan) {
        await cancelLoan.mutateAsync(loan.id);
        notify("Loan cancelled successfully", "success");
        onClose();
        return;
      }

      const { latitude, longitude } = await getLocation();
      await returnLoan.mutateAsync({
        id: loan.id,
        data: { latitude, longitude },
      });
      notify("Item returned successfully", "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to return",
        "error",
      );
    }
  };

  const handleExtend = async () => {
    setShowExtend(false);
    try {
      await extendLoan.mutateAsync({
        id: loan.id,
        data: { days: parseInt(extendDays, 10) },
      });
      notify("Loan extended successfully", "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to extend",
        "error",
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { p: 3 } } }}
      >
        <DialogTitle sx={{ p: 0 }}>Loan Details</DialogTitle>
        <DialogContent
          sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/*Item name, status and shortId*/}
          <Box>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                sx={{
                  cursor: "pointer",
                  color: "primary.main",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={() => {
                  onClose();
                  navigate(`/item/${loan.item?.shortId}`);
                }}
              >
                {loan.item?.name}
              </Typography>
              <StatusBadge status={loanStatus} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {loan.item?.shortId}
            </Typography>
          </Box>

          {/* borrower */}
          {loan.user && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body2">Borrower</Typography>
              <Typography variant="body2" color="text.secondary">
                {loan.user.fullName || loan.user.email}
              </Typography>
            </Box>
          )}

          {/* checkout / due / return dates */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body2">Checked Out</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(loan.checkoutDate)}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body2">Due</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDayOfWeekDate(loan.dueDate)}
              </Typography>
            </Box>
            {loan.returnDate && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Typography variant="body2">Returned</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(loan.returnDate)}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* checkout location */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="subtitle2">Checkout Location</Typography>
            <LocationMinimap
              latitude={loan.openedLatitude}
              longitude={loan.openedLongitude}
              height={200}
            />
          </Box>

          {/* return location */}
          {loan.closedLatitude != null && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="subtitle2">Return Location</Typography>
              <LocationMinimap
                latitude={loan.closedLatitude}
                longitude={loan.closedLongitude}
                height={200}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 0, pt: 1 }}>
          <Button onClick={onClose}>Back</Button>
          {isActive && (isOwnLoan || showAdminActions) && (
            <>
              <Button
                onClick={() => setConfirmReturn(true)}
                disabled={
                  returnLoan.isPending ||
                  cancelLoan.isPending ||
                  locationLoading
                }
                color={isOwnLoan ? "success" : "error"}
                variant="contained"
              >
                {returnLoan.isPending ||
                cancelLoan.isPending ||
                locationLoading ? (
                  <CircularProgress size={20} />
                ) : isOwnLoan ? (
                  "Return"
                ) : (
                  "Cancel"
                )}
              </Button>

              <Button variant="contained" onClick={() => setShowExtend(true)}>
                Extend
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      {/* Return / Cancel Confirmation */}
      <ConfirmDialog
        open={confirmReturn}
        title={isOwnLoan ? "Return Item" : "Cancel Loan"}
        message={
          isOwnLoan
            ? `Return "${loan.item?.name}"? Your location will be recorded.`
            : `Cancel the loan for "${loan.item?.name}"?`
        }
        onConfirm={handleReturn}
        cancelText="Back"
        onCancel={() => setConfirmReturn(false)}
        confirmText={isOwnLoan ? "Return" : "Cancel Loan"}
        confirmColor={isOwnLoan ? "success" : "error"}
      />

      {/* Extend Dialog */}
      <Dialog
        open={showExtend}
        onClose={() => setShowExtend(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { p: 3 } } }}
      >
        <DialogTitle sx={{ p: 0, mb: 1 }}>Extend Loan</DialogTitle>
        <DialogContent sx={{ p: 0, pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Extend the loan for &quot;{loan.item?.name}&quot; by up to 30 days.
          </Typography>
          <TextField
            label="Days"
            type="number"
            size="small"
            value={extendDays}
            onChange={(e) =>
              setExtendDays(
                Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
              )
            }
            slotProps={{ htmlInput: { min: 1, max: 30 } }}
            sx={{ width: 100 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 0, pt: 1 }}>
          <Button onClick={() => setShowExtend(false)}>Back</Button>
          <Button
            variant="contained"
            onClick={handleExtend}
            disabled={extendLoan.isPending}
          >
            {extendLoan.isPending ? <CircularProgress size={20} /> : "Extend"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
