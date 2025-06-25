import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";
import { LoadingScreen } from "./LoadingScreen";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole | UserRole[];
  redirectTo?: string;
}

export const RoleProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
}: RoleProtectedRouteProps) => {
  const { user, userData, loading, hasRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (!hasRole(allowedRoles)) {
    console.log(
      "Access denied. User role:",
      userData?.role,
      "Required roles:",
      allowedRoles
    );
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
