import { useState } from "react";
import { useUsers, useUser } from "../../hooks/useUsers";
import { Container, Typography, Chip } from "@mui/material";
import DataTable from "../../components/DataTable";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import UserDetailModal from "../../features/users/UserDetailModal";
import { formatDate } from "../../utils/date";

export default function Users() {
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useUsers({ pageSize: 500 });
  const { data: selectedUser } = useUser(selectedUserId);

  const columns = [
    {
      id: "fullName",
      label: "Name",
      value: (row) => row.fullName ?? "",
      render: (row) => row.fullName || "—",
    },
    { id: "email", label: "Email" },
    {
      id: "role",
      label: "Role",
      value: (row) => row.role,
      render: (row) => (
        <Chip
          label={row.role.charAt(0) + row.role.slice(1).toLowerCase()}
          size="small"
          color={row.role === "ADMIN" ? "primary" : "warning"}
          variant="outlined"
        />
      ),
    },
    {
      id: "isActive",
      label: "Status",
      value: (row) => (row.isActive ? "Active" : "Inactive"),
      render: (row) => (
        <Chip
          label={row.isActive ? "Active" : "Inactive"}
          size="small"
          color={row.isActive ? "success" : "warning"}
          variant="outlined"
        />
      ),
    },
    {
      id: "createdAt",
      label: "Joined",
      type: "date",
      value: (row) => (row.createdAt ? new Date(row.createdAt) : null),
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState message="No users found" />
      ) : (
        <DataTable
          columns={columns}
          rows={data.data}
          sortBy="createdAt"
          sortOrder="desc"
          showToolbar
          onRowClick={(row) => setSelectedUserId(row.id)}
        />
      )}

      <UserDetailModal
        user={selectedUser}
        open={!!selectedUserId && !!selectedUser}
        onClose={() => setSelectedUserId(null)}
      />
    </Container>
  );
}
