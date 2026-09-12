import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100dvh"
      sx={{ width: "100%", overflow: "hidden", overscrollBehavior: "none" }}
    >
      <Navbar />
      <Box
        component="main"
        flexGrow={1}
        display="flex"
        flexDirection="column"
        sx={{
          px: 2,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "none",
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
