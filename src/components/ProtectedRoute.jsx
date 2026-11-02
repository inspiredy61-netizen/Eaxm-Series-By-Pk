import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ admin = false }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="screen-center"><div className="spinner"/><p>Loading your workspace...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && profile?.role !== "admin") return <Navigate to="/app" replace />;
  if (!admin && profile?.role === "admin") return <Navigate to="/admin" replace />;
  return <Outlet/>;
}
