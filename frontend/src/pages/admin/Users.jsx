import { useState, useMemo } from "react";
import { useUsers, useUser } from "../../hooks/useUsers";
import { Container, Typography, Chip } from "@mui/material";
import DataTable from "../../components/DataTable";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import UserDetailModal from "../../features/users/UserDetailModal";
import { formatDate } from "../../utils/date";
import UserListToolbar from "../../features/users/UserListToolbar";

export default function Users() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  // Single request for the whole list; the grid slices it client-side.
  const { data, isLoading } = useUsers({ pageSize: 500 });
  const { data: selectedUser } = useUser(selectedUserId);

  const allUsers = useMemo(() => data?.data ?? [], [data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (role && user.role !== role) return false;
      if (!term) return true;
      return (
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    });
  }, [allUsers, search, role]);

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    role,
    onRoleChange: setRole,
  };

  const columns = [
    {
      id: "fullName",
      label: "Name",
      value: (row) => row.fullName ?? "",
      render: (row) => row.fullName || "—",
    },
    {
      id: "role",
      label: "Role",
      width: 90,
      minWidth: 90,
      value: (row) => row.role,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            label={row.role.charAt(0) + row.role.slice(1).toLowerCase()}
            size="small"
            color={row.role === "ADMIN" ? "primary" : "warning"}
            variant="filled"
          />
        </div>
      ),
    },
    {
      id: "email",
      label: "Email",
      width: 250,
      minWidth: 100,
    },
    {
      id: "isActive",
      label: "Status",
      width: 90,
      minWidth: 90,
      value: (row) => (row.isActive ? "Active" : "Inactive"),
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            label={row.isActive ? "Active" : "Inactive"}
            size="small"
            color={row.isActive ? "success" : "error"}
            variant="filled"
          />
        </div>
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
    <Container maxWidth="lg" sx={{ mt: 4, p: 0 }}>
      <Typography variant="h4" gutterBottom>
        Members
      </Typography>

      {isLoading ? (
        <TableSkeleton />
      ) : !allUsers.length ? (
        <EmptyState message="No users found" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          sortBy="createdAt"
          sortOrder="desc"
          showToolbar
          toolbar={UserListToolbar}
          toolbarProps={toolbarProps}
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
