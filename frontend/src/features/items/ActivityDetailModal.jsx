import { formatDateTime } from "../../utils/date";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LocationMinimap from "../../components/LocationMinimap";
import { useNotification } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

const eventChipConfig = {
  Created: { color: "info" },
  "Checked Out": { color: "warning" },
  Returned: { color: "success" },
  "Loan Cancelled": { color: "default" },
  "Found Report Filed": { color: "secondary" },
};

export default function ActivityDetailModal({ entry, open, onClose }) {
  const { notify } = useNotification();
  const navigate = useNavigate();

  if (!entry) return null;

  const hasLocation = entry.latitude != null && entry.longitude != null;
  const coords = hasLocation ? `${entry.latitude}, ${entry.longitude}` : null;
  const displayCoords = hasLocation
    ? `${entry.latitude.toFixed(3)}, ${entry.longitude.toFixed(3)}`
    : null;

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText(coords);
      notify("Coordinates copied", "success");
    } catch {
      notify("Failed to copy coordinates", "error");
    }
  };

  const handleUserClick = () => {
    onClose();
    navigate("/admin/users");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Activity Detail</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={entry.type}
            color={eventChipConfig[entry.type]?.color || "default"}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          Date / Time
        </Typography>
        <Typography variant="body1" gutterBottom>
          {formatDateTime(entry.timestamp)}
        </Typography>

        {entry.user && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              User
            </Typography>
            <Typography
              variant="body1"
              sx={{
                cursor: "pointer",
                color: "primary.main",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={handleUserClick}
            >
              {entry.user.fullName || entry.user.email}
            </Typography>
          </Box>
        )}

        {entry.contactInfo && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Contact Info
            </Typography>
            <Typography variant="body1">{entry.contactInfo}</Typography>
          </Box>
        )}

        {entry.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {entry.description}
            </Typography>
          </>
        )}

        {hasLocation && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Location
            </Typography>
            <Tooltip title="Copy coordinates">
              <Box
                onClick={handleCopyCoords}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  mb: 1,
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Typography variant="body2">{displayCoords}</Typography>
                <ContentCopyIcon fontSize="small" />
              </Box>
            </Tooltip>
            <LocationMinimap
              latitude={entry.latitude}
              longitude={entry.longitude}
              height={200}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
