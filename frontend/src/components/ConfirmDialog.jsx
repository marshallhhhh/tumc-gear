import {
  DialogContentText,
  Button,
} from "@mui/material";
import { Dialog, DialogContent, DialogActions, DialogTitle } from "./Dialog";

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "error",
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle gutterBottom sx={{ p: 0 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ p: 0, pt: 1 }}>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 0, pt: 1 }}>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
