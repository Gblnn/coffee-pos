import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import { Unauthorized } from "./pages/Unauthorized";
import { Billing } from "./pages/pos/Billing";
import { Inventory } from "./pages/pos/Inventory";
import UserManagement from "./pages/user-management";
import { RoleProtectedRoute } from "./components/common/RoleProtectedRoute";
import Suppliers from "./pages/Suppliers";
import CreditBook from "./pages/Credit-Book";
import Bills from "./pages/Bills";
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin routes */}
            <Route
              path="/index"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/user-management"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Cashier routes */}
            <Route
              path="/billing"
              element={
                <RoleProtectedRoute allowedRoles={["cashier", "admin"]}>
                  <MainLayout>
                    <Billing />
                  </MainLayout>
                </RoleProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/inventory"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <MainLayout>
                    <Inventory />
                  </MainLayout>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/suppliers"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Suppliers />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/credit-book"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <CreditBook />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/bills"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Bills />
                </RoleProtectedRoute>
              }
            />
            {/* Default route - redirect to role-specific page */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

// Component to handle role-based redirection
const RoleBasedRedirect = () => {
  const { userData } = useAuth();

  if (userData?.role === "admin") {
    return <Navigate to="/index" replace />;
  }

  return <Navigate to="/billing" replace />;
};

export default App;
