import { Link as RouterLink } from "react-router-dom";
import { Container, Box, Typography, Button } from "@mui/material";

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 12, textAlign: "center" }}>
        <Typography variant="h2" color="text.disabled" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          That page doesn&apos;t exist
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/home"
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
}
