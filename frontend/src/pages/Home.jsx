import { useState, useCallback, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import QrScanner from "../components/QrScanner";

const SHORT_ID_REGEX = /^[A-Z]{3}-\d{3,}$/;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [shortId, setShortId] = useState("");
  const [shortIdError, setShortIdError] = useState("");
  const logoClickCount = useRef(0);

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickCount.current >= 15) {
      logoClickCount.current = 0;
      window.open("https://youtu.be/1dJLN43G6KA?si=EYvxtBzo91PJbbRl", "_blank", "noopener,noreferrer");
    }
  };

  const handleShortIdSubmit = (e) => {
    e.preventDefault();
    const formatted = shortId.toUpperCase().trim();
    if (!SHORT_ID_REGEX.test(formatted)) {
      setShortIdError("Format must be AAA-### (e.g. HAR-001)");
      return;
    }
    setShortIdError("");
    navigate(`/item/${formatted}`);
  };

  const handleScan = useCallback(
    (nanoid) => {
      navigate(`/t/${nanoid}`);
    },
    [navigate],
  );

  const handleShortIdChange = (e) => {
    let val = e.target.value.toUpperCase();
    const formatted = val
      .replace(/[^A-Z0-9]/g, (match, offset) => {
        if (match === "-" && offset === 3) return "-";
        return "";
      })
      .slice(0, 7);
    // auto-insert dash after 3 characters
    if (formatted.length <= 3) {
      setShortId(formatted);
    } else if (formatted[3] !== "-") {
      setShortId(`${formatted.slice(0, 3)}-${formatted.slice(3)}`);
    } else {
      setShortId(formatted);
    }
    setShortIdError("");
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            mb: 1,
          }}
        >
          <Box
            component="img"
            src="/logo-full.png"
            alt="Logo"
            onClick={handleLogoClick}
            sx={{ height: 100, width: "auto", mb: 3, cursor: "pointer" }}
          />
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 0 }}
            >
              {import.meta.env.VITE_APP_TITLE || "Gear Manager"}
            </Typography>
            {isAuthenticated && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome! Scan a QR code or enter a Short ID to get started.
              </Typography>
            )}
            {!isAuthenticated && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Want to borrow gear? Sign in or create an account to get
                started.
              </Typography>
            )}
          </Box>
        </Box>

        {!isAuthenticated && (
          <Paper
            sx={{
              p: 3,
              mb: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              justifyContent: "center",
            }}
          >
            <Button variant="contained" component={RouterLink} to="/login">
              Sign In
            </Button>
            <Button variant="outlined" component={RouterLink} to="/signup">
              Sign Up
            </Button>
          </Paper>
        )}

        {isAuthenticated && (
          <>
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <QrScanner
                onScan={handleScan}
                variant="contained"
                color="primary"
                size="large"
                sx={{ mb: 2, width: "100%" }}
              />
              <Divider sx={{ my: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  or enter manually
                </Typography>
              </Divider>
              <Box component="form" onSubmit={handleShortIdSubmit}>
                <TextField
                  label="Short ID"
                  placeholder="HAR-123"
                  fullWidth
                  value={shortId}
                  onChange={handleShortIdChange}
                  error={!!shortIdError}
                  helperText={shortIdError}
                  slotProps={{
                    htmlInput: { maxLength: 7 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={!shortId}
                >
                  Submit
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}
