import { Component } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      // Keep diagnostics in development tools, not in user-facing UI.
      console.error("Unhandled UI error captured by ErrorBoundary", {
        error,
        componentStack: errorInfo?.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: 1,
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Something went wrong
              </Typography>
              <Typography color="text.secondary">
                The page hit an unexpected error. You can try again or refresh
                the app.
              </Typography>
              {import.meta.env.DEV && this.state.error?.message && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: "monospace",
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    p: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error.message}
                </Typography>
              )}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="contained" onClick={this.handleRetry}>
                  Try again
                </Button>
                <Button variant="outlined" onClick={this.handleRefresh}>
                  Refresh app
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
