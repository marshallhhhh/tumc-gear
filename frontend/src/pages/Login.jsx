import { useState } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";

export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const returnUrl = location.state?.from || "/home";

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    try {
      await resetPassword(email);
      notify("Check your email for a reset link", "info");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Log In
        </Typography>
        <Paper sx={{ p: 3, width: "100%" }} elevation={2}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            gap={3}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Box display="flex" flexDirection="column" gap={1}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Link
                width="100%"
                underline="none"
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                Forgot password?
              </Link>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !email || !password}
            >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
            <Link
              underline="none"
              component={RouterLink}
              to="/signup"
              variant="body2"
              sx={{ display: "flex", justifyContent: "center" }}
            >
              Don&apos;t have an account? Sign up
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
