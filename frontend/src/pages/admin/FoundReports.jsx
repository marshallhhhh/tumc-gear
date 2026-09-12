import { useState } from "react";
import { useFoundReports } from "../../hooks/useFoundReports";
import { Container, Typography } from "@mui/material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import FoundReportDetailModal from "../../features/foundReports/FoundReportDetailModal";
import { formatDate } from "../../utils/date";

export default function FoundReports() {
  const [selectedReport, setSelectedReport] = useState(null);

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useFoundReports({ pageSize: 500 });

  const columns = [
    {
      id: "status",
      label: "Status",
      value: (row) => row.status,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: "item",
      label: "Item",
      value: (row) => row.item?.name ?? "",
      render: (row) => row.item?.name,
    },
    {
      id: "createdAt",
      label: "Reported",
      type: "date",
      value: (row) => (row.createdAt ? new Date(row.createdAt) : null),
      render: (row) => formatDate(row.createdAt),
    },
    {
      id: "contactInfo",
      label: "Contact",
      value: (row) => row.contactInfo ?? "",
      render: (row) => row.contactInfo || "—",
    },
    {
      id: "description",
      label: "Description",
      value: (row) => row.description ?? "",
      render: (row) =>
        row.description
          ? row.description.length > 50
            ? row.description.substring(0, 50) + "…"
            : row.description
          : "—",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Found Reports
      </Typography>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState message="No found reports" />
      ) : (
        <DataTable
          columns={columns}
          rows={data.data}
          sortBy="createdAt"
          sortOrder="desc"
          showToolbar
          onRowClick={(row) => setSelectedReport(row)}
        />
      )}

      <FoundReportDetailModal
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </Container>
  );
}
