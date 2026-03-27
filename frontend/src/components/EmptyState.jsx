import { Box, Typography } from "@mui/material";
import { SearchOff as SearchOffIcon } from "@mui/icons-material";

export default function EmptyState({
  message = "No data found",
  icon: Icon = SearchOffIcon,
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
    >
      <Icon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
