import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/context';

// Wraps all pages that need a login. <Outlet /> is where the wrapped page is rendered.
const ProtectedRoute = () => {
  const { signedIn, loading } = useAuth();
  const location = useLocation();

  // The stored session is still being checked: don't redirect yet, or a reload would always end on /login
  if (loading) return <span className='loading loading-spinner loading-lg mx-auto my-10' />;

  // Remember where the user wanted to go, so Login can send them back there
  if (!signedIn) return <Navigate to='/login' replace state={{ from: location }} />;

  return <Outlet />;
};

export default ProtectedRoute;
