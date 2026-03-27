import { useState } from "react";
import { useMyLoans } from "../hooks/useLoans";
import {
  Container,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { Assignment as LoansIcon } from "@mui/icons-material";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { TableSkeleton } from "../components/PageSkeleton";
import LoanDetailModal from "../features/loans/LoanDetailModal";
import { formatDate } from "../utils/date";

const isOverdue = (loan) =>
  loan.status === "ACTIVE" &&
  new Date(loan.dueDate) < new Date(new Date().toDateString());

export default function MyLoans() {
  const { data: loans, isLoading } = useMyLoans();
  const [selectedLoan, setSelectedLoan] = useState(null);

  if (isLoading)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <TableSkeleton />
      </Container>
    );

  const activeLoans = loans?.filter((l) => l.status === "ACTIVE") || [];
  const pastLoans = loans?.filter((l) => l.status !== "ACTIVE") || [];

  if (!loans?.length) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Loans
        </Typography>
        <EmptyState message="You have no loans" icon={LoansIcon} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Loans
      </Typography>

      {activeLoans.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Active
          </Typography>
          <List>
            {activeLoans.map((loan) => (
              <ListItemButton
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
              >
                <ListItemText
                  primary={loan.item?.name}
                  secondary={`Due: ${formatDate(loan.dueDate)}`}
                  slotProps={{
                    primary: {
                      color: "primary",
                      variant: "h6",
                    },
                  }}
                />
                <StatusBadge
                  size="small"
                  status={isOverdue(loan) ? "OVERDUE" : "ACTIVE"}
                />
              </ListItemButton>
            ))}
          </List>
        </>
      )}

      {pastLoans.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">Returned / Cancelled</Typography>
          <List>
            {pastLoans.map((loan) => (
              <ListItemButton
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
              >
                <ListItemText
                  primary={loan.item?.name}
                  secondary={`Checked out: ${formatDate(loan.checkoutDate)}`}
                />
                <StatusBadge status={loan.status} />
              </ListItemButton>
            ))}
          </List>
        </>
      )}

      <LoanDetailModal
        loan={selectedLoan}
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
      />
    </Container>
  );
}
