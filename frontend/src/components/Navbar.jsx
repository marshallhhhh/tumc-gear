import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
  Divider,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from "@mui/material";
import {
  Home as HomeIcon,
  Login as LoginIcon,
  PersonAdd as SignUpIcon,
  Assignment as LoansIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Inventory as GearIcon,
  People as UsersIcon,
  FindInPage as ReportsIcon,
  Logout as LogoutIcon,
  MoreHoriz as MoreIcon,
  WatchLater as OverdueIcon,
  AssignmentInd as MyLoansIcon,
} from "@mui/icons-material";

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [loansMenuAnchor, setLoansMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

  const handleSignOut = async () => {
    setUserMenuAnchor(null);
    await signOut();
    navigate("/home");
  };

  if (isMobile) {
    if (loading) {
      return (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: "primary.main",
            p: 1,
            display: "flex",
            justifyContent: "space-around",
          }}
          elevation={3}
          aria-busy="true"
        >
          <Skeleton variant="rounded" width={72} height={36} />
          <Skeleton variant="rounded" width={72} height={36} />
          <Skeleton variant="rounded" width={72} height={36} />
        </Paper>
      );
    }

    return (
      <MobileNav
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        navigate={navigate}
        onSignOut={handleSignOut}
        moreMenuAnchor={moreMenuAnchor}
        setMoreMenuAnchor={setMoreMenuAnchor}
      />
    );
  }

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <Box component={RouterLink} to="/home" sx={{ display: "flex", mr: 2 }}>
          <Box
            component="img"
            src="/logo-xs.png"
            alt="Logo"
            sx={{ height: 40 }}
          />
        </Box>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/home"
          sx={{ textDecoration: "none", color: "inherit", mr: 3 }}
        >
          {import.meta.env.VITE_APP_TITLE || "Gear Manager"}
        </Typography>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
          {loading && (
            <>
              <Skeleton variant="rounded" width={84} height={36} />
              <Skeleton variant="rounded" width={84} height={36} />
            </>
          )}

          {!isAuthenticated && !loading && (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Sign In
              </Button>
              <Button color="inherit" component={RouterLink} to="/signup">
                Sign Up
              </Button>
            </>
          )}

          {isAuthenticated && !loading && (
            <>
              <Button color="inherit" component={RouterLink} to="/home">
                Borrow
              </Button>
              <Button color="inherit" component={RouterLink} to="/my-loans">
                My Loans
              </Button>
            </>
          )}

          {isAdmin && !loading && (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/admin/dashboard"
              >
                Dashboard
              </Button>
              <Button color="inherit" component={RouterLink} to="/admin/items">
                Gear
              </Button>
              <Button color="inherit" component={RouterLink} to="/admin/users">
                Users
              </Button>
              <Button
                color="inherit"
                onClick={(e) => setLoansMenuAnchor(e.currentTarget)}
              >
                Loans
              </Button>
              <Menu
                anchorEl={loansMenuAnchor}
                open={Boolean(loansMenuAnchor)}
                onClose={() => setLoansMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setLoansMenuAnchor(null);
                    navigate("/admin/loans");
                  }}
                >
                  All Loans
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setLoansMenuAnchor(null);
                    navigate("/admin/loans?overdue=true");
                  }}
                >
                  Overdue Loans
                </MenuItem>
              </Menu>
              <Button
                color="inherit"
                component={RouterLink}
                to="/admin/found-reports"
              >
                Found Reports
              </Button>
            </>
          )}
        </Box>

        {isAuthenticated && !loading && (
          <>
            <Button
              color="inherit"
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            >
              {user?.fullName || "Account"}
            </Button>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  navigate("/profile");
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>My Profile</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign Out</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

function MobileNav({
  isAuthenticated,
  isAdmin,
  navigate,
  onSignOut,
  moreMenuAnchor,
  setMoreMenuAnchor,
}) {
  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: "primary.main",
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        sx={{
          backgroundColor: "primary.main",
          "& .Mui-selected": { color: "white" },
        }}
      >
        {!isAuthenticated && [
          <BottomNavigationAction
            key="home"
            label="Home"
            icon={<HomeIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/home")}
            sx={{ color: "white" }}
          />,
          <BottomNavigationAction
            key="login"
            label="Sign In"
            icon={<LoginIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/login")}
            sx={{ color: "white" }}
          />,
          <BottomNavigationAction
            key="signup"
            label="Sign Up"
            icon={<SignUpIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/signup")}
            sx={{ color: "white" }}
          />,
        ]}

        {isAuthenticated &&
          !isAdmin && [
            <BottomNavigationAction
              key="home"
              label="Borrow"
              icon={<HomeIcon sx={{ color: "white" }} />}
              onClick={() => navigate("/home")}
              sx={{ color: "white" }}
            />,
            <BottomNavigationAction
              key="loans"
              label="My Loans"
              icon={<MyLoansIcon sx={{ color: "white" }} />}
              onClick={() => navigate("/my-loans")}
              sx={{ color: "white" }}
            />,
            <BottomNavigationAction
              key="more"
              label="More"
              icon={<MoreIcon sx={{ color: "white" }} />}
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{ color: "white" }}
            />,
          ]}

        {isAdmin && [
          <BottomNavigationAction
            key="home"
            label="Borrow"
            icon={<HomeIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/home")}
            sx={{ color: "white" }}
          />,
          <BottomNavigationAction
            key="dash"
            label="Dashboard"
            icon={<DashboardIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/admin/dashboard")}
            sx={{ color: "white" }}
          />,
          <BottomNavigationAction
            key="gear"
            label="Gear"
            icon={<GearIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/admin/items")}
            sx={{ color: "white" }}
          />,
          <BottomNavigationAction
            key="more"
            label="More"
            icon={<MoreIcon sx={{ color: "white" }} />}
            onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
            sx={{ color: "white" }}
          />,
        ]}
      </BottomNavigation>

      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {isAuthenticated && [
          <MenuItem
            key="myloans"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/my-loans");
            }}
          >
            <ListItemIcon>
              <MyLoansIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Loans</ListItemText>
          </MenuItem>,
        ]}
        {isAdmin && [
          <MenuItem
            key="users"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/admin/users");
            }}
          >
            <ListItemIcon>
              <UsersIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Members</ListItemText>
          </MenuItem>,
          <MenuItem
            key="allloans"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/admin/loans");
            }}
          >
            <ListItemIcon>
              <LoansIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>All Loans</ListItemText>
          </MenuItem>,
          <MenuItem
            key="overdue"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/admin/loans?overdue=true");
            }}
          >
            <ListItemIcon>
              <OverdueIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Overdue Loans</ListItemText>
          </MenuItem>,
          <MenuItem
            key="reports"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/admin/found-reports");
            }}
          >
            <ListItemIcon>
              <ReportsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Found Reports</ListItemText>
          </MenuItem>,
        ]}
        {isAuthenticated && [
          <Divider key="div" />,
          <MenuItem
            key="profile"
            onClick={() => {
              setMoreMenuAnchor(null);
              navigate("/profile");
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>,
          <MenuItem
            key="signout"
            onClick={() => {
              setMoreMenuAnchor(null);
              onSignOut();
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>,
        ]}
      </Menu>
    </Paper>
  );
}
