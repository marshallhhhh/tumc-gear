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

const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
const APP_HOST = new URL(appUrl).hostname.toLowerCase();

const NANOID_REGEX = /^[A-Za-z0-9_-]{6}$/;

const SCANNER_ELEMENT_ID = "qr-scanner-reader";

function getQrNanoId(decodedText) {
  try {
    const scannedUrl = new URL(decodedText);
    const parts = scannedUrl.pathname.split("/").filter(Boolean);
    const tIdx = parts.indexOf("t");
    const scannedHost = scannedUrl.hostname.toLowerCase();

    if (
      scannedHost === APP_HOST &&
      tIdx !== -1 &&
      parts[tIdx + 1] &&
      NANOID_REGEX.test(parts[tIdx + 1])
    ) {
      return `${parts[tIdx + 1]}`;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export default function QrScanner({ onScan, children, ...buttonProps }) {
  const { notify } = useNotification();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const html5QrCodeRef = useRef(null);
  const lastScanRef = useRef(0);
  const scannerElRef = useRef(null);
  const detachVideoListenersRef = useRef(() => {});
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const handleOpen = () => {
    setLoading(true);
    setOpen(true);
  };

  const stopScanner = () => {
    detachVideoListenersRef.current();
    const s = html5QrCodeRef.current;
    if (s) {
      try {
        s.stop()
          .catch(() => {})
          .finally(() => {
            try {
              s.clear();
            } catch {
              /* scanner may already be cleared */
            }
          });
      } catch {
        /* stop() throws synchronously if scanner never started */
        try {
          s.clear();
        } catch {
          /* ignore */
        }
      }
      html5QrCodeRef.current = null;
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function startScanning() {
      try {
        let cameraConfig;
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length) {
            const backCamera = cameras.find((c) =>
              /back|rear|environment/i.test(c.label),
            );
            cameraConfig = backCamera?.id || cameras[0].id;
          } else {
            notifyRef.current("No cameras found", "error");
          }
        } catch {
          notifyRef.current("Error loading camera", "error");
          /* camera enumeration not supported, fall through */
        }
        if (!cameraConfig) cameraConfig = { facingMode: "environment" };

        if (cancelled) return;
        if (!document.getElementById(SCANNER_ELEMENT_ID)) return;

        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const now = Date.now();
            if (now - lastScanRef.current < 2000) return;
            lastScanRef.current = now;

            const qrNanoId = getQrNanoId(decodedText);
            if (!qrNanoId) {
              setOpen(false);
              notifyRef.current(`Invalid QR code`, "error");
              return;
            }

            setOpen(false);
            onScanRef.current(qrNanoId);
          },
          () => {},
        );

        if (cancelled) {
          stopScanner();
          return;
        }

        // Scale scanner container to visually cover the parent square
        // Using CSS transform preserves clientWidth/clientHeight so the
        // library's scan-region math stays correct.
        const container = scannerElRef.current;
        const video = container?.querySelector("video");

        const applyCoverScale = () => {
          const parentEl = container?.parentElement;
          if (parentEl && container && container.clientHeight) {
            const scale = Math.max(
              1,
              parentEl.clientHeight / container.clientHeight,
            );
            container.style.transform = `translate(-50%, -50%) scale(${scale})`;
          }
        };

        if (video && video.readyState < 2) {
          const handleVideoReady = () => {
            applyCoverScale();
            setLoading(false);
            video.removeEventListener("loadeddata", handleVideoReady);
            video.removeEventListener("canplay", handleVideoReady);
            detachVideoListenersRef.current = () => {};
          };
          video.addEventListener("loadeddata", handleVideoReady);
          video.addEventListener("canplay", handleVideoReady);
          detachVideoListenersRef.current = () => {
            video.removeEventListener("loadeddata", handleVideoReady);
            video.removeEventListener("canplay", handleVideoReady);
          };
        } else {
          applyCoverScale();
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setOpen(false);
          notifyRef.current("Error loading camera", "error");
        }
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      stopScanner();
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

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { p: 3 } } }}
      >
        <DialogTitle sx={{ p: 0, pt: 1 }} gutterBottom>
          Scan QR Code
        </DialogTitle>
        <DialogContent sx={{ p: 0, pt: 1 }}>
          <Box
            borderRadius={1}
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              overflow: "hidden",
            }}
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
            <Box
              id={SCANNER_ELEMENT_ID}
              ref={scannerElRef}
              sx={{
                width: "100%",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Shaded overlay with transparent cutout for QR frame */}
            {!loading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <mask id="qr-frame-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x="10%"
                        y="10%"
                        width="80%"
                        height="80%"
                        rx="12"
                        ry="12"
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.5)"
                    mask="url(#qr-frame-mask)"
                  />
                  <rect
                    x="10%"
                    y="10%"
                    width="80%"
                    height="80%"
                    rx="12"
                    ry="12"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.7"
                  />
                </svg>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 0, pt: 1 }}>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
