import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useFoundReports } from "../../hooks/useFoundReports";
import { Container, Typography } from "@mui/material";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import FoundReportDetailModal from "../../features/foundReports/FoundReportDetailModal";
import { formatDate } from "../../utils/date";

export default function FoundReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReport, setSelectedReport] = useState(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const status = searchParams.get("status") || "";

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...(status && { status }),
  };

  const { data, isLoading } = useFoundReports(queryParams);

  const updateParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  const columns = [
    {
      id: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "item",
      label: "Item",
      sortable: false,
      render: (row) => row.item?.name,
    },
    {
      id: "createdAt",
      label: "Reported",
      render: (row) => formatDate(row.createdAt),
    },
    {
      id: "contactInfo",
      label: "Contact",
      render: (row) => row.contactInfo || "—",
    },
    {
      id: "description",
      label: "Description",
      sortable: false,
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
          totalCount={data.totalCount}
          page={page - 1}
          pageSize={pageSize}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={(p) => updateParam("page", String(p + 1))}
          onPageSizeChange={(ps) => {
            updateParam("pageSize", String(ps));
            updateParam("page", "1");
          }}
          onSortChange={(col, order) => {
            updateParam("sortBy", col);
            updateParam("sortOrder", order);
          }}
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
