import { useState, useMemo } from "react";
import { useAllUsers, useUser } from "../../hooks/useUsers";
import useListState from "../../hooks/useListState";
import { Container, Typography, Chip } from "@mui/material";
import { AdminPanelSettingsOutlined, PersonOutline } from "@mui/icons-material";
import DataTable from "../../components/DataTable";
import { TableSkeleton } from "../../components/PageSkeleton";
import EmptyState from "../../components/EmptyState";
import TruncationAlert from "../../components/TruncationAlert";
import UserDetailModal from "../../features/users/UserDetailModal";
import { formatDate } from "../../utils/date";
import UserListToolbar from "../../features/users/UserListToolbar";

export default function Users() {
  const [selectedUserId, setSelectedUserId] = useState(null);

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
    filters: { role: "" },
  });

  // The whole list is fetched once (paged through server-side); the grid then
  // sorts, filters and paginates it client-side without further requests.
  const { data, isLoading, isFetching } = useAllUsers();
  const { data: selectedUser } = useUser(selectedUserId);

  const allUsers = useMemo(() => data?.data ?? [], [data]);

  const { role } = filters;

  const rows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (role && user.role !== role) return false;
      if (!term) return true;
      return (
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    });
  }, [allUsers, debouncedSearch, role]);

  const toolbarProps = {
    search,
    onSearchChange: setSearch,
    role,
    onRoleChange: (value) => setFilter("role", value),
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
      width: 110,
      minWidth: 110,
      value: (row) => row.role,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            size="small"
            icon={
              row.role === "ADMIN" ? (
                <AdminPanelSettingsOutlined fontSize="small" />
              ) : (
                <PersonOutline fontSize="small" />
              )
            }
            label={row.role === "ADMIN" ? "Admin" : "Member"}
            color={row.role === "ADMIN" ? "secondary" : "default"}
            variant={row.role === "ADMIN" ? "filled" : "outlined"}
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
            size="small"
            label={row.isActive ? "Active" : "Inactive"}
            color={row.isActive ? "success" : "default"}
            variant={row.isActive ? "filled" : "outlined"}
            sx={
              row.isActive ? { bgcolor: "#ccfcd2", color: "#000" } : undefined
            }
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

      {data?.truncated && <TruncationAlert totalCount={data.totalCount} />}

      {isLoading ? (
        <TableSkeleton />
      ) : !allUsers.length ? (
        <EmptyState message="No users found" />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          loading={isFetching}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
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
