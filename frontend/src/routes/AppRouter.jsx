import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Public pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import ItemDetail from "../pages/ItemDetail";
import ReportFound from "../pages/ReportFound";
import QrLanding from "../pages/QrLanding";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";

// Member pages
import MyLoans from "../pages/MyLoans";
import Profile from "../pages/Profile";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import GearList from "../pages/admin/GearList";
import GearDetail from "../pages/admin/GearDetail";
import Users from "../pages/admin/Users";
import Loans from "../pages/admin/Loans";
import FoundReports from "../pages/admin/FoundReports";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/item/:shortId" element={<ItemDetail />} />
        <Route path="/report-found" element={<ReportFound />} />
        <Route path="/t/:nanoid" element={<QrLanding />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Member */}
        <Route
          path="/my-loans"
          element={
            <ProtectedRoute>
              <MyLoans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/items"
          element={
            <AdminRoute>
              <GearList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/items/:shortId"
          element={
            <AdminRoute>
              <GearDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/loans"
          element={
            <AdminRoute>
              <Loans />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/found-reports"
          element={
            <AdminRoute>
              <FoundReports />
            </AdminRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
