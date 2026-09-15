import { Chip, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import ListToolbar from "../../components/ListToolbar";

/**
 * Toolbar for the admin user list: free-text search, an inline role filter
 * and the built-in DataGrid CSV/print export.
 */
export default function UserListToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
}) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      exportFileName="users"
      showPrint
      wrap
      collapsibleFilters={false}
      renderFilters={() => (
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            label="Role"
            renderValue={(value) =>
              value ? (
                <Chip
                  label={value.charAt(0) + value.slice(1).toLowerCase()}
                  size="small"
                  color={value === "ADMIN" ? "primary" : "warning"}
                  variant="outlined"
                />
              ) : (
                <span style={{ color: "text.secondary" }}>All Roles</span>
              )
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ADMIN">
              <Chip
                label="Admin"
                size="small"
                color="primary"
                variant="outlined"
              />
            </MenuItem>
            <MenuItem value="MEMBER">
              <Chip
                label="Member"
                size="small"
                color="warning"
                variant="outlined"
              />
            </MenuItem>
          </Select>
        </FormControl>
      )}
    />
  );
}
