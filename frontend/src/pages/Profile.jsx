import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useUpdateMe } from "../hooks/useUsers";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";

const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;

export default function Profile() {
  const { user, resetPassword } = useAuth();
  const { notify } = useNotification();
  const updateMe = useUpdateMe();

  const [fullName, setFullName] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setNameError("Name is required");
      return;
    }
    if (!NAME_REGEX.test(fullName)) {
      setNameError(
        "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
      );
      return;
    }
    setNameError("");
    try {
      await updateMe.mutateAsync({ fullName });
      notify("Profile updated", "success");
    } catch (err) {
      notify(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile",
        "error",
      );
    }
  };

  const handleChangePassword = async () => {
    try {
      await resetPassword(user.email);
      notify("Check your email for a password reset link", "success");
    } catch (err) {
      notify(
        err.response?.data?.message ||
          err.message ||
          "Failed to send reset email",
        "error",
      );
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      <Paper sx={{ p: 3 }} elevation={2}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={user?.email || ""}
          disabled
        />
        <TextField
          label="Full Name"
          fullWidth
          margin="normal"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError("");
          }}
          error={!!nameError}
          helperText={nameError}
        />
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateMe.isPending}
          >
            {updateMe.isPending ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button variant="outlined" onClick={handleChangePassword}>
            Change Password
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
