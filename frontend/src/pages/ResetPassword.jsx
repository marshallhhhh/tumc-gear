import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { supabase } from "../services/supabase";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also mark as ready immediately if user is already authenticated via recovery
    setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      notify("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      notify("Password updated successfully", "success");
      navigate("/home");
    } catch (err) {
      notify(err.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Verifying recovery link...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Reset Password
        </Typography>
        <Paper sx={{ p: 3, width: "100%" }} elevation={2}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="New Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword.length > 0 && password !== confirmPassword}
              helperText={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
              autoComplete="new-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? <CircularProgress size={24} /> : "Update Password"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
