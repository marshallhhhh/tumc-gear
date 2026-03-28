import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoans, useCancelLoan } from "../../hooks/useLoans";
import { useNotification } from "../../context/NotificationContext";
import { Container, Typography } from "@mui/material";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import LoanDetailModal from "../../features/loans/LoanDetailModal";
import { formatDate } from "../../utils/date";

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

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const status = searchParams.get("status") || "";
  const overdue = searchParams.get("overdue") || "";

  const queryParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...(status && { status }),
    ...(overdue && { overdue }),
  };

  const { data, isLoading } = useLoans(queryParams);

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

  const handleCancel = async () => {
    setCancelConfirm(false);
    try {
      await cancelLoan.mutateAsync(selectedLoan.id);
      notify("Loan cancelled", "success");
      setSelectedLoan(null);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to cancel loan", "error");
    }
  };

  const columns = [
    {
      id: "item",
      label: "Item",
      sortable: false,
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
      sortable: false,
      render: (row) => row.user?.fullName || row.user?.email || "—",
    },
    {
      id: "checkoutDate",
      label: "Checkout",
      render: (row) => formatDate(row.checkoutDate),
    },
    { id: "dueDate", label: "Due", render: (row) => formatDate(row.dueDate) },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={isOverdue(row) ? "OVERDUE" : row.status} />
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
      ) : !data?.data?.length ? (
        <EmptyState message="No loans found" />
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
