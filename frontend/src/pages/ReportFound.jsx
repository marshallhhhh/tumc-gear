import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useCreateFoundReport } from "../hooks/useFoundReports";
import { getItemById } from "../services/items";
import { useGeolocation } from "../hooks/useGeolocation";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from "@mui/material";

export default function ReportFound() {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("itemId");
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [shareLocation, setShareLocation] = useState(false);

  const createReport = useCreateFoundReport();
  const { getLocation } = useGeolocation();

  useEffect(() => {
    if (!itemId) {
      setLoadingItem(false);
      return;
    }
    getItemById(itemId)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoadingItem(false));
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      itemId,
      contactInfo: contactInfo || undefined,
      description: description || undefined,
    };

    if (shareLocation) {
      try {
        const { latitude, longitude } = await getLocation();
        payload.latitude = latitude;
        payload.longitude = longitude;
      } catch {
        notify("Location access denied", "warning");
      }
    }

    try {
      await createReport.mutateAsync(payload);
      notify("Report submitted", "success");
      navigate("/home");
    } catch (err) {
      if (err.response?.status === 409) {
        notify("A report for this item has already been filed", "error");
      } else {
        notify(
          err.response?.data?.message || "Failed to submit report",
          "error",
        );
      }
    }
  };

  if (loadingItem) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!itemId || !item) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">Item not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Report Found Item
      </Typography>
      <Typography variant="h6" gutterBottom>
        You found our gear!
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Please fill in the form below to let us know how we can get it back.
      </Typography>
      <Typography variant="body2" color="textSecondary" marginY={1}>
        Alternatively you can contact us directly at{" "}
        <a href="mailto:tasuniclimbing@gmail.com">tasuniclimbing@gmail.com</a>.
        Or call the Tasmanian University Student Association (TUSA) at{" "}
        <a href="tel:+610362262495">03 6226 2495</a>.
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }} elevation={2}>
        <Typography variant="body1" gutterBottom>
          <strong>{item.name}</strong> ({item.shortId})
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Contact Information"
            fullWidth
            margin="normal"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText="Optional — how can we reach you?"
          />
          <TextField
            label="How can we get the item back?"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: 2000 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
              />
            }
            label="Share my location"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={createReport.isPending}
          >
            {createReport.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Report"
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
