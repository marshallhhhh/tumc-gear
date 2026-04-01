import { Box } from "@mui/material";
import { useState } from "react";
import StatusChip from "../../components/StatusChip";
import DataTable from "../../components/DataTable";
import ActivityDetailModal from "./ActivityDetailModal";
import { formatDate } from "../../utils/date";

const columns = [
  {
    id: "type",
    label: "Event",
    sortable: false,
    render: (row) => <StatusChip status={row.type} />,
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
    type: "CREATED",
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
        type: "CHECKED_OUT",
        timestamp: loan.checkoutDate,
        user: loan.user,
        latitude: loan.openedLatitude,
        longitude: loan.openedLongitude,
      });

      if (loan.status === "RETURNED" && loan.returnDate) {
        entries.push({
          id: `return-${loan.id}`,
          type: "RETURNED",
          timestamp: loan.returnDate,
          user: loan.user,
          latitude: loan.closedLatitude,
          longitude: loan.closedLongitude,
        });
      }

      if (loan.status === "CANCELLED" && loan.cancelledAt) {
        entries.push({
          id: `cancel-${loan.id}`,
          type: "CANCELLED",
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
        type: "FOUND_REPORT_FILED",
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
