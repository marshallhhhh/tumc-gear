import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
} from "@mui/material";
import {
  Inventory as GearIcon,
  Assignment as LoansIcon,
  People as UsersIcon,
  FindInPage as ReportsIcon,
  WatchLater as OverdueIcon,
} from "@mui/icons-material";
import { CardsSkeleton } from "../../components/PageSkeleton";
import theme from "../../theme";

const defaultColor = "#647088";
const alertColor = theme.palette.error.main;
const alertKeys = new Set(["openFoundReports", "overdueLoans"]);
const notifyKeys = new Set(["activeLoans"]);

const statCards = [
  {
    key: "totalItems",
    label: "Total Items",
    icon: GearIcon,
    path: "/admin/items",
  },
  {
    key: "openFoundReports",
    label: "Open Found Reports",
    icon: ReportsIcon,
    path: "/admin/found-reports?status=OPEN",
  },
  {
    key: "activeLoans",
    label: "Active Loans",
    icon: LoansIcon,
    path: "/admin/loans?status=ACTIVE",
  },
  {
    key: "overdueLoans",
    label: "Overdue Loans",
    icon: OverdueIcon,
    path: "/admin/loans?overdue=true",
  },
  {
    key: "totalUsers",
    label: "Total Users",
    icon: UsersIcon,
    path: "/admin/users",
  },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboard();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {isLoading ? (
        <CardsSkeleton />
      ) : (
        <Grid container spacing={3}>
          {statCards.map(({ key, label, icon: Icon, path }) => {
            const value = stats?.[key] ?? 0;
            let color = defaultColor;
            if (alertKeys.has(key) && value > 0) {
              color = alertColor;
            } else if (notifyKeys.has(key) && value > 0) {
              color = theme.palette.primary.main;
            }

            return (
              <Grid key={key} size={{ xs: 6, sm: 6, md: 4 }}>
                <Card>
                  <CardActionArea onClick={() => navigate(path)}>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        gap={2}
                        justifyContent="center"
                      >
                        <Icon sx={{ fontSize: 40, color, mb: 1 }} />
                        <Typography
                          variant="h4"
                          color={color}
                          sx={{ fontWeight: "bold" }}
                        >
                          {value}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
