import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  children: React.ReactNode;
  requireUsername?: boolean;
};

const ProtectedRoute = ({ children, requireUsername = true }: Props) => {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate('/', { replace: true, state: { from: location.pathname } });
    else if (requireUsername && profile && !profile.username) navigate('/setup-username', { replace: true });
  }, [session, profile, loading, navigate, requireUsername, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!session) return null;
  if (requireUsername && profile && !profile.username) return null;
  return <>{children}</>;
};

export default ProtectedRoute;
