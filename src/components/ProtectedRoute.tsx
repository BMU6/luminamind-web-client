import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context";

const ProtectedRoute = () => {
  const { signedIn, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Wait until the application finishes parsing the token session
    if (loading) return;

    // 2. If the validation fails, route securely back to the login screen
    if (!signedIn) {
      navigate("/login", {
        state: { from: location },
        replace: true,
      });
    }
  }, [signedIn, loading, location, navigate]);

  // 3. Render a clean loading spacer during initial token handshakes
  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // 4. Return layout fallback block while navigate loop safely executes
  if (!signedIn) {
    return null;
  }

  // 5. Success: mount the nested router layout page view seamlessly
  return <Outlet />;
};

export default ProtectedRoute;
