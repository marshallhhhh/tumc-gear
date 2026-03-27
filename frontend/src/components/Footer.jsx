import { Box, Typography } from "@mui/material";

export default function Footer() {
  const footerText = import.meta.env.VITE_FOOTER_TEXT;

  if (!footerText) return null;

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        textAlign: "center",
        borderTop: 1,
        borderColor: "divider",
        mt: "auto",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {footerText}
      </Typography>
    </Box>
  );
}
