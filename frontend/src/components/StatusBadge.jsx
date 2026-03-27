import { Chip } from "@mui/material";

const statusConfig = {
  ACTIVE: { label: "Active", color: "success" },
  RETURNED: { label: "Returned", color: "default" },
  CANCELLED: { label: "Cancelled", color: "warning" },
  OVERDUE: { label: "Overdue", color: "error" },
  AVAILABLE: { label: "Available", color: "success" },
  CHECKED_OUT: { label: "Checked Out", color: "error" },
  OPEN: { label: "Open", color: "warning" },
  CLOSED: { label: "Closed", color: "default" },
};

export default function StatusBadge({ status, size = "small" }) {
  const config = statusConfig[status] || { label: status, color: "default" };

  return <Chip label={config.label} color={config.color} size={size} />;
}
