import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Only redirect if we have both user and userData
  if (user && userData) {
    const redirectPath = userData.role === "admin" ? "/index" : "/billing";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
