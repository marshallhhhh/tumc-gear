import { Box, Chip } from "@mui/material";
import { useState } from "react";
import DataTable from "../../components/DataTable";
import ActivityDetailModal from "./ActivityDetailModal";
import { formatDate } from "../../utils/date";

const eventChipConfig = {
  Created: { color: "secondary" },
  "Checked Out": { color: "info" },
  Returned: { color: "success" },
  "Loan Cancelled": { color: "warning" },
  "Found Report Filed": { color: "error" },
};

const columns = [
  {
    id: "type",
    label: "Event",
    sortable: false,
    render: (row) => (
      <Chip
        label={row.type}
        size="small"
        color={eventChipConfig[row.type]?.color || "default"}
      />
    ),
  },
  {
    id: "timestamp",
    label: "Date",
    sortable: false,
    render: (row) => formatDate(row.timestamp),
  },
  {
    id: "user",
    label: "User",
    sortable: false,
    render: (row) => (row.user ? row.user.fullName || row.user.email : "—"),
  },
];

function buildActivityEntries(item) {
  const entries = [];

  // Item created event
  entries.push({
    id: "created",
    type: "Created",
    timestamp: item.createdAt,
    user: null,
    latitude: null,
    longitude: null,
  });

  // Loan events
  if (item.loans) {
    for (const loan of item.loans) {
      entries.push({
        id: `checkout-${loan.id}`,
        type: "Checked Out",
        timestamp: loan.checkoutDate,
        user: loan.user,
        latitude: loan.openedLatitude,
        longitude: loan.openedLongitude,
      });

      if (loan.status === "RETURNED" && loan.returnDate) {
        entries.push({
          id: `return-${loan.id}`,
          type: "Returned",
          timestamp: loan.returnDate,
          user: loan.user,
          latitude: loan.closedLatitude,
          longitude: loan.closedLongitude,
        });
      }

      if (loan.status === "CANCELLED" && loan.cancelledAt) {
        entries.push({
          id: `cancel-${loan.id}`,
          type: "Loan Cancelled",
          timestamp: loan.cancelledAt,
          user: loan.cancelledByAdmin || loan.user,
          latitude: null,
          longitude: null,
        });
      }
    }
  }

  // Found report events
  if (item.foundReports) {
    for (const report of item.foundReports) {
      entries.push({
        id: `report-${report.id}`,
        type: "Found Report Filed",
        timestamp: report.createdAt,
        user: report.reporter,
        latitude: report.latitude,
        longitude: report.longitude,
        contactInfo: report.contactInfo,
        description: report.description,
      });
    }
  }

  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return entries;
}

export default function ActivityHistory({ item }) {
  const [selectedEntry, setSelectedEntry] = useState(null);

  const entries = buildActivityEntries(item);

  if (!entries.length) return null;

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={entries}
        onRowClick={setSelectedEntry}
      />
      <ActivityDetailModal
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </Box>
  );
}
