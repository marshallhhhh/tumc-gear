import { useState, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
} from "@mui/material";
import { QrCodeScanner as QrCodeScannerIcon } from "@mui/icons-material";
import { Html5Qrcode } from "html5-qrcode";
import { useNotification } from "../context/NotificationContext";

const APP_URL = import.meta.env.VITE_APP_URL || "";
const QR_PATTERN = new RegExp(
  `^${APP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/t/[A-Za-z0-9_-]{6}$`,
);

export default function QrScanner({ onScan, children, ...buttonProps }) {
  const { notify } = useNotification();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef(0);
  const scannerElRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const handleOpen = () => {
    setLoading(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const scannerId = "qr-scanner-" + Date.now();
    if (scannerElRef.current) {
      scannerElRef.current.id = scannerId;
    }

    const timer = setTimeout(() => {
      try {
        if (!document.getElementById(scannerId)) {
          throw new Error("Scanner element not found");
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              const now = Date.now();
              if (now - lastScanRef.current < 2000) return;
              lastScanRef.current = now;

              if (!QR_PATTERN.test(decodedText)) {
                setOpen(false);
                notifyRef.current("Invalid QR code", "error");
                return;
              }

              const match = decodedText.match(/\/t\/([A-Za-z0-9_-]{6})$/);
              if (match) {
                setOpen(false);
                onScanRef.current(match[1]);
              }
            },
            () => {}, //
          )
          .then(() => setLoading(false))
          .catch(() => {
            setOpen(false);
            notifyRef.current("Error loading camera", "error");
          });
      } catch {
        setOpen(false);
        notifyRef.current("Error loading camera", "error");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [open]);

  return (
    <>
      <Button
        startIcon={<QrCodeScannerIcon />}
        onClick={handleOpen}
        {...buttonProps}
      >
        {children || "Scan QR Code"}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogContent>
          <Box
            sx={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}
          >
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Box ref={scannerElRef} sx={{ width: "100%", height: "100%" }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
