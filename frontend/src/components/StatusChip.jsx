import { Chip } from "@mui/material";

const statusConfig = {
  ACTIVE: {
    label: "Active",
    color: "success",
    sx: { backgroundColor: "#ccfcd2", color: "#000000" },
  },
  RETURNED: { label: "Returned", color: "success" },
  CANCELLED: { label: "Cancelled", color: "background" },
  OVERDUE: { label: "Overdue", color: "error" },
  AVAILABLE: { label: "Available", color: "success" },
  CHECKED_OUT: { label: "Checked Out", color: "error" },
  OPEN: { label: "Open", color: "warning" },
  CLOSED: { label: "Closed", color: "default" },
  CREATED: { label: "Created", color: "info" },
  FOUND_REPORT_FILED: { label: "Found Report Filed", color: "warning" },
};

export default function StatusChip({ status, size = "small" }) {
  const config = statusConfig[status] || {
    label: status,
    color: "default",
    variant: "filled",
  };

  return (
    <Chip
      label={config.label}
      color={config.color}
      variant={config.variant}
      size={size}
      sx={config.sx}
    />
  );
}
