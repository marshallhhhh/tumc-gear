import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

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
      slotProps={{ paper: { sx: { p: 3 } } }}
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      sx={{ p: 0 }}
    >
      <DialogTitle gutterBottom sx={{ p: 0 }}>{title}</DialogTitle>
      <DialogContent  sx={{ p: 0, pt: 1 }}>
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
