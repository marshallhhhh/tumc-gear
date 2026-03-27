import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box
        component="main"
        flexGrow={1}
        display="flex"
        flexDirection="column"
        sx={{ pb: 2 }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
