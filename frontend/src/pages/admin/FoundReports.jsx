import { useState, useMemo } from "react";
import { useAllFoundReports } from "../../hooks/useFoundReports";
import useListState from "../../hooks/useListState";
import { Container, Typography } from "@mui/material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import TruncationAlert from "../../components/TruncationAlert";
import FoundReportDetailModal from "../../features/foundReports/FoundReportDetailModal";
import FoundReportListToolbar from "../../features/foundReports/FoundReportListToolbar";
import { formatDate } from "../../utils/date";

export default function FoundReports() {
  const [selectedReport, setSelectedReport] = useState(null);

  const {
    search,
    debouncedSearch,
    setSearch,
    filters,
    setFilter,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
  } = useListState({
    sortBy: "createdAt",
    sortOrder: "desc",
    filters: { status: "" },
  });

  // The whole list is fetched once (paged through server-side); the grid then
  // sorts, filters and paginates it client-side without further requests.
  const { data, isLoading, isFetching } = useAllFoundReports();

  const allReports = useMemo(() => data?.data ?? [], [data]);

  const { status } = filters;

  const rows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return allReports.filter((report) => {
      if (status && report.status !== status) return false;
      if (!term) return true;
      return (
        report.item?.name?.toLowerCase().includes(term) ||
        report.contactInfo?.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term)
      );
    });
  }, [allReports, debouncedSearch, status]);

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    status,
    onStatusChange: (value) => setFilter("status", value),
  };

  const columns = [
    {
      id: "status",
      label: "Status",
      width: 100,
      minWidth: 100,
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
    <Container maxWidth="lg" sx={{ mt: 4, p: 0 }}>
      <Typography variant="h4" gutterBottom>
        Found Reports
      </Typography>

      {data?.truncated && <TruncationAlert totalCount={data.totalCount} />}

      {isLoading ? (
        <TableSkeleton />
      ) : !allReports.length ? (
        <EmptyState message="No found reports" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={isFetching}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          toolbar={FoundReportListToolbar}
          toolbarProps={toolbarProps}
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
