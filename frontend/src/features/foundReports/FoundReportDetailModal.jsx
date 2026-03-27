import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LocationMinimap from "../../components/LocationMinimap";
import StatusBadge from "../../components/StatusBadge";
import { useCloseFoundReport } from "../../hooks/useFoundReports";
import { useNotification } from "../../context/NotificationContext";
import { formatDateTime } from "../../utils/date";

export default function FoundReportDetailModal({ report, open, onClose }) {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const closeReport = useCloseFoundReport();

  if (!report) return null;

  const handleClose = async () => {
    try {
      await closeReport.mutateAsync(report.id);
      notify("Report closed", "success");
      onClose();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to close report", "error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { p: 3 } } }}
    >
      <DialogTitle sx={{ p: 0 }}>Found Report</DialogTitle>
      <DialogContent
        sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              cursor: "pointer",
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/items/${report.item?.shortId}`);
            }}
          >
            {report.item?.name}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            fontFamily="monospace"
          >
            {report.item?.shortId}
          </Typography>
          <StatusBadge status={report.status} alignSelf="flex-start" />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography variant="body2">Reported</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(report.createdAt)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography variant="body2">Contact</Typography>
            <Typography variant="body2" color="text.secondary">
              {report.contactInfo || "N/A"}
            </Typography>
          </Box>
        </Box>

        {report.description && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Divider />
            <Typography variant="subtitle2">Description</Typography>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap" }}
              color="text.secondary"
            >
              {report.description}
            </Typography>
          </Box>
        )}

        {report.latitude != null && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Location</Typography>
            <LocationMinimap
              latitude={report.latitude}
              longitude={report.longitude}
              height={150}
            />
          </Box>
        )}

        {report.closedAt && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body2">Closed</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(report.closedAt)}
              </Typography>
            </Box>
            {report.closedByAdmin && (
              <Typography variant="body2">
                Closed by:{" "}
                {report.closedByAdmin.fullName || report.closedByAdmin.email}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 0, mt: 2 }}>
        {report.status === "OPEN" && (
          <Button
            color="error"
            variant="contained"
            onClick={handleClose}
            disabled={closeReport.isPending}
          >
            Close Report
          </Button>
        )}
        <Button variant="outlined" onClick={onClose}>
          Back
        </Button>
      </DialogActions>
    </Dialog>
  );
}
