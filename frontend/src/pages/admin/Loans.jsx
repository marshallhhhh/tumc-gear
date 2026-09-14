import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLoans, useCancelLoan } from "../../hooks/useLoans";
import { useNotification } from "../../context/NotificationContext";
import { Container, Typography } from "@mui/material";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import ConfirmDialog from "../../components/ConfirmDialog";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import LoanDetailModal from "../../features/loans/LoanDetailModal";
import { formatDate } from "../../utils/date";
import LoanListToolbar from "../../features/loans/LoanListToolbar";

const isOverdue = (loan) =>
  loan.status === "ACTIVE" &&
  new Date(loan.dueDate) < new Date(new Date().toDateString());

export default function Loans() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const cancelLoan = useCancelLoan();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [search, setSearch] = useState("");

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useLoans({ pageSize: 500 });

  const allLoans = useMemo(() => data?.data ?? [], [data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allLoans;
    return allLoans.filter(
      (loan) =>
        loan.item?.name?.toLowerCase().includes(term) ||
        loan.user?.fullName?.toLowerCase().includes(term) ||
        loan.user?.email?.toLowerCase().includes(term),
    );
  }, [allLoans, search]);

  const toolbarProps = { search, onSearchChange: setSearch };

  const handleCancel = async () => {
    setCancelConfirm(false);
    try {
      await cancelLoan.mutateAsync(selectedLoan.id);
      notify("Loan cancelled", "success");
      setSelectedLoan(null);
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to cancel loan",
        "error",
      );
    }
  };

  const columns = [
    {
      id: "item",
      label: "Item",
      value: (row) => row.item?.name ?? "",
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            cursor: "pointer",
            color: "primary.main",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/items/${row.item?.shortId}`);
          }}
        >
          {row.item?.name}
        </Typography>
      ),
    },
    {
      id: "user",
      label: "Borrower",
      value: (row) => row.user?.fullName || row.user?.email || "",
      render: (row) => row.user?.fullName || row.user?.email || "—",
    },
    {
      id: "checkoutDate",
      label: "Checkout",
      type: "date",
      value: (row) => (row.checkoutDate ? new Date(row.checkoutDate) : null),
      render: (row) => formatDate(row.checkoutDate),
    },
    {
      id: "dueDate",
      label: "Due",
      type: "date",
      value: (row) => (row.dueDate ? new Date(row.dueDate) : null),
      render: (row) => formatDate(row.dueDate),
    },
    {
      id: "status",
      label: "Status",
      value: (row) => (isOverdue(row) ? "OVERDUE" : row.status),
      render: (row) => (
        <StatusChip status={isOverdue(row) ? "OVERDUE" : row.status} />
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Loans
      </Typography>

      {isLoading ? (
        <TableSkeleton />
      ) : !allLoans.length ? (
        <EmptyState message="No loans found" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          sortBy="checkoutDate"
          sortOrder="desc"
          toolbar={LoanListToolbar}
          toolbarProps={toolbarProps}
          onRowClick={(row) => setSelectedLoan(row)}
        />
      )}

      {/* Loan Detail Modal */}
      <LoanDetailModal
        loan={selectedLoan}
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        showAdminActions={true}
      />

      <ConfirmDialog
        open={cancelConfirm}
        title="Cancel Loan"
        message={`Cancel the loan for ${selectedLoan?.item?.name}? The item will become available.`}
        onConfirm={handleCancel}
        onCancel={() => setCancelConfirm(false)}
      />
    </Container>
  );
}
