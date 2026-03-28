import { useState } from "react";
import { useMyLoans } from "../hooks/useLoans";
import {
  Container,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
  TablePagination,
} from "@mui/material";
import { Assignment as LoansIcon } from "@mui/icons-material";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { TableSkeleton } from "../components/PageSkeleton";
import LoanDetailModal from "../features/loans/LoanDetailModal";
import { formatDate } from "../utils/date";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Returned", value: "RETURNED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const isOverdue = (loan) =>
  loan.status === "ACTIVE" &&
  new Date(loan.dueDate) < new Date(new Date().toDateString());

export default function MyLoans() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const status = STATUS_TABS[tab].value;
  const queryParams = {
    page: page + 1,
    pageSize,
    ...(status && { status }),
  };

  const { data, isLoading } = useMyLoans(queryParams);
  const loans = data?.data || [];

  const handleTabChange = (_e, newTab) => {
    setTab(newTab);
    setPage(0);
  };

  if (isLoading)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <TableSkeleton />
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Loans
      </Typography>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        {STATUS_TABS.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

      {loans.length === 0 ? (
        <EmptyState message="No loans found" icon={LoansIcon} />
      ) : (
        <List>
          {loans.map((loan) => (
            <ListItemButton key={loan.id} onClick={() => setSelectedLoan(loan)}>
              <ListItemText
                primary={loan.item?.name}
                secondary={
                  loan.status === "ACTIVE"
                    ? `Due: ${formatDate(loan.dueDate)}`
                    : `Checked out: ${formatDate(loan.checkoutDate)}`
                }
                slotProps={{
                  primary: {
                    color: "primary",
                    variant: "h6",
                  },
                }}
              />
              <StatusBadge
                size="small"
                status={isOverdue(loan) ? "OVERDUE" : loan.status}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {(data?.totalCount ?? 0) > 0 && (
        <TablePagination
          component="div"
          count={data?.totalCount ?? 0}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      <LoanDetailModal
        loan={selectedLoan}
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
      />
    </Container>
  );
}
