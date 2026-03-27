import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Divider,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useNotification } from "../../context/NotificationContext";
import { useAssignQr, useUnassignQr } from "../../hooks/useQr";
import ConfirmDialog from "../../components/ConfirmDialog";
import QrScanner from "../../components/QrScanner";

export default function QrTagSection({ item, onUpdated }) {
  const { notify } = useNotification();
  const assignQr = useAssignQr();
  const unassignQr = useUnassignQr();

  const [nanoidInput, setNanoidInput] = useState("");
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
  const [pendingNanoid, setPendingNanoid] = useState("");

  const appUrl = import.meta.env.VITE_APP_URL || "";

  const handleScan = useCallback((nanoid) => {
    setPendingNanoid(nanoid);
    setAssignConfirmOpen(true);
  }, []);

  const handleNanoidSubmit = () => {
    if (nanoidInput.length !== 6) {
      notify("Nanoid must be exactly 6 characters", "error");
      return;
    }
    setPendingNanoid(nanoidInput);
    setAssignConfirmOpen(true);
  };

  const handleAssign = async () => {
    setAssignConfirmOpen(false);
    try {
      await assignQr.mutateAsync({ nanoid: pendingNanoid, itemId: item.id });
      notify("QR tag assigned", "success");
      setPendingNanoid("");
      setNanoidInput("");
      onUpdated?.();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to assign QR tag", "error");
    }
  };

  const handleRemove = async () => {
    setRemoveConfirmOpen(false);
    try {
      await unassignQr.mutateAsync(item.qrTag.id);
      notify("QR tag removed", "success");
      onUpdated?.();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to remove QR tag", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        QR Tag
      </Typography>

      {item.qrTag ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <QRCodeSVG
            value={`${appUrl}/t/${item.qrTag.nanoid}`}
            size={160}
            style={{ marginTop: 8 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {item.qrTag.nanoid}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="medium"
            sx={{ mt: 2 }}
            onClick={() => setRemoveConfirmOpen(true)}
            disabled={unassignQr.isPending}
          >
            {unassignQr.isPending ? (
              <CircularProgress size={20} />
            ) : (
              "Remove QR"
            )}
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No QR tag associated with this item
          </Typography>
          <QrScanner
            onScan={handleScan}
            variant="contained"
            fullWidth
            sx={{ mb: 1 }}
          >
            Scan QR
          </QrScanner>
          <Divider sx={{ my: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              or enter manually
            </Typography>
          </Divider>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              label="nanoid"
              size="small"
              value={nanoidInput}
              onChange={(e) => setNanoidInput(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 6 } }}
              placeholder="6 characters"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="medium"
              onClick={handleNanoidSubmit}
              disabled={nanoidInput.length !== 6}
              sx={{ whiteSpace: "nowrap", alignSelf: "stretch" }}
            >
              Assign
            </Button>
          </Box>
        </Box>
      )}

      <ConfirmDialog
        open={assignConfirmOpen}
        title="Assign QR Tag"
        message={`Assign this QR tag to ${item.name}?`}
        onConfirm={handleAssign}
        onCancel={() => setAssignConfirmOpen(false)}
        confirmText="Assign"
        confirmColor="primary"
      />

      <ConfirmDialog
        open={removeConfirmOpen}
        title="Remove QR Tag"
        message={`Remove the QR tag from ${item.name}? The tag will become unassigned.`}
        onConfirm={handleRemove}
        onCancel={() => setRemoveConfirmOpen(false)}
      />
    </Box>
  );
}
