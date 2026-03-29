import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useItem } from "../hooks/useItems";
import { useCreateLoan, useReturnLoan } from "../hooks/useLoans";
import { formatDate } from "../utils/date";
import { useGeolocation } from "../hooks/useGeolocation";
import { QRCodeSVG } from "qrcode.react";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import StatusBadge from "../components/StatusBadge";
import { DetailSkeleton } from "../components/PageSkeleton";
import { ErrorOutline as ErrorIcon } from "@mui/icons-material";

export default function ItemDetail() {
  const { shortId } = useParams();
  const { isMember, isAuthenticated, user, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const {
    data: item,
    isLoading,
    error,
  } = useItem(shortId, { waitForAuth: authLoading });
  const createLoan = useCreateLoan();
  const returnLoan = useReturnLoan();
  const { getLocation, loading: locationLoading } = useGeolocation();

  const [days, setDays] = useState(7);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (isLoading || authLoading)
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <DetailSkeleton />
      </Container>
    );
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error.response?.status === 404
            ? "Item does not exist"
            : "Failed to load item"}
        </Alert>
      </Container>
    );
  }

  const activeLoan = item?.activeLoan;
  const isAvailable = !activeLoan && !item?.hasActiveLoan;
  const isMyLoan = activeLoan?.userId === user?.id;
  const appUrl = import.meta.env.VITE_APP_URL || "";

  const handleCheckout = async () => {
    try {
      const { latitude, longitude } = await getLocation();
      await createLoan.mutateAsync({
        itemId: item.id,
        days: parseInt(days, 10),
        latitude,
        longitude,
      });
      setCheckoutOpen(false);
      notify("Item checked out successfully", "success");
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to checkout",
        "error",
      );
    }
  };

  const handleReturn = async () => {
    try {
      const { latitude, longitude } = await getLocation();
      await returnLoan.mutateAsync({
        id: activeLoan.id,
        data: { latitude, longitude },
      });
      notify("Item returned successfully", "success");
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to return",
        "error",
      );
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      }}
    >
      <Paper sx={{ p: 3, width: "100%" }} elevation={2}>
        <Box
          gap={2}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          {/* header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent={"space-between"}
            width="100%"
          >
            <Typography variant="h4">{item.name}</Typography>
            {isMember && (
              <StatusBadge status={isAvailable ? "AVAILABLE" : "CHECKED_OUT"} />
            )}
          </Box>
          <Box width="100%" alignItems={"left"}>
            <Typography variant="body1" color="text.secondary">
              {item.category?.name}
            </Typography>
            <Typography
              fontFamily="monospace"
              variant="body2"
              color="text.secondary"
            >
              {item.shortId}
            </Typography>
          </Box>

          {/* qrtag */}
          {item.qrTag && (
            <QRCodeSVG value={`${appUrl}/t/${item.qrTag.nanoid}`} size={128} />
          )}

          {/* Sign in prompt for unauthenticated users */}
          {!isAuthenticated && (
            <Button
              fullWidth
              variant="contained"
              onClick={() =>
                navigate("/login", { state: { from: `/item/${shortId}` } })
              }
            >
              Sign in to borrow this item
            </Button>
          )}

          {/* Checkout button for members when item is available */}
          {isMember && isAvailable && (
            <Button
              fullWidth
              variant="contained"
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout
            </Button>
          )}

          {/* Return section for members when it's their loan */}
          {isMember && isMyLoan && (
            <Box width="100%" display="flex" flexDirection={"column"} gap={1}>
              <Box
                width="100%"
                display="flex"
                alignItems="center"
                justifyContent={"space-between"}
              >
                <Typography variant="body1" color="text.secondary">
                  Checked Out
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {formatDate(activeLoan.checkoutDate)}
                </Typography>
              </Box>
              <Box
                width="100%"
                display="flex"
                alignItems="center"
                justifyContent={"space-between"}
              >
                <Typography variant="body1" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {formatDate(activeLoan.dueDate)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleReturn}
                disabled={returnLoan.isPending || locationLoading}
              >
                {returnLoan.isPending || locationLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Return"
                )}
              </Button>
            </Box>
          )}
          {isMember && activeLoan && !isMyLoan && (
            <Box display="flex" alignItems="center" gap={1}>
              <ErrorIcon color="warning" fontSize="medium" />
              <Typography variant="body1" color="warning">
                This item is checked out by another member.
              </Typography>
            </Box>
          )}
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={() => navigate(`/report-found?itemId=${item.id}`)}
          >
            Report Found
          </Button>

          <Dialog
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Checkout — {item?.name}</DialogTitle>
            <DialogContent>
              <TextField
                label="Loan duration (days)"
                type="number"
                value={days}
                onChange={(e) =>
                  setDays(
                    Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
                  )
                }
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
                size="small"
                fullWidth
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCheckout}
                disabled={createLoan.isPending || locationLoading}
              >
                {createLoan.isPending || locationLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Paper>
    </Container>
  );
}
