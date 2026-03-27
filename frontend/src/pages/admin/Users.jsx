import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useUsers, useUser } from "../../hooks/useUsers";
import { Container, Typography, Chip } from "@mui/material";
import DataTable from "../../components/DataTable";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import UserDetailModal from "../../features/users/UserDetailModal";
import { formatDate } from "../../utils/date";

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const { data, isLoading } = useUsers({ page, pageSize, sortBy, sortOrder });
  const { data: selectedUser } = useUser(selectedUserId);

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
    { id: "fullName", label: "Name", render: (row) => row.fullName || "—" },
    { id: "email", label: "Email" },
    {
      id: "role",
      label: "Role",
      render: (row) => (
        <Chip
          label={row.role.charAt(0) + row.role.slice(1).toLowerCase()}
          size="small"
          color={row.role === "ADMIN" ? "primary" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      id: "isActive",
      label: "Status",
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
