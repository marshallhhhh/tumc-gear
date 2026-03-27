import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  CircularProgress,
} from "@mui/material";

const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;

export default function SignUp() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!NAME_REGEX.test(fullName)) {
      setError(
        "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
      );
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Account Created!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Check your email to finish setting up your account.
          </Typography>
          <Link component={RouterLink} to="/login" variant="body1">
            Go to Sign In
          </Link>
        </Box>
      </Container>
    );
  }

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
          Sign Up
        </Typography>
        <Paper sx={{ p: 3, width: "100%" }} elevation={2}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Full Name"
              fullWidth
              required
              margin="normal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              helperText="Letters, spaces, hyphens, apostrophes, and periods only"
              error={fullName.length > 0 && !NAME_REGEX.test(fullName)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Minimum 6 characters"
              error={password.length > 0 && password.length < 6}
              autoComplete="new-password"
            />
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 1 }}
              disabled={loading || !email || !fullName || !password}
            >
              {loading ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ mt: 1, display: "flex", justifyContent: "center" }}
            >
              Already have an account? Sign in
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
