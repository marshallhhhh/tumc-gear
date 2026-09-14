import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useNotification();

  const cancelLoan = useCancelLoan();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(
    searchParams.get("status")?.toUpperCase() || "",
  );
  const [borrower, setBorrower] = useState("");

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set("status", newStatus.toLowerCase());
    } else {
      params.delete("status");
    }
    setSearchParams(params);
  };

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useLoans({ pageSize: 500 });

  const allLoans = useMemo(() => data?.data ?? [], [data]);

  const borrowers = useMemo(() => {
    const byId = new Map();
    for (const loan of allLoans) {
      if (loan.user?.id && !byId.has(loan.user.id)) {
        byId.set(loan.user.id, {
          id: loan.user.id,
          label: loan.user.fullName || loan.user.email || "",
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [allLoans]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allLoans.filter((loan) => {
      if (status && (isOverdue(loan) ? "OVERDUE" : loan.status) !== status)
        return false;
      if (borrower && loan.user?.id !== borrower) return false;
      if (!term) return true;
      return (
        loan.item?.name?.toLowerCase().includes(term) ||
        loan.user?.fullName?.toLowerCase().includes(term) ||
        loan.user?.email?.toLowerCase().includes(term)
      );
    });
  }, [allLoans, search, status, borrower]);

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    status,
    onStatusChange: handleStatusChange,
    borrowers,
    borrower,
    onBorrowerChange: setBorrower,
  };

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
      id: "status",
      label: "Status",
      width: 110,
      minWidth: 110,
      value: (row) => (isOverdue(row) ? "OVERDUE" : row.status),
      render: (row) => (
        <StatusChip status={isOverdue(row) ? "OVERDUE" : row.status} />
      ),
    },
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
      width: 120,
      minWidth: 120,
    },
    {
      id: "dueDate",
      label: "Due",
      type: "date",
      value: (row) => (row.dueDate ? new Date(row.dueDate) : null),
      render: (row) => formatDate(row.dueDate),
      width: 120,
      minWidth: 120,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, p: 0 }}>
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
