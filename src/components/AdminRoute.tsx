import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'advisor' | 'user';
}

export const AdminRoute = ({ children, requiredRole = 'user' }: AdminRouteProps) => {
  const { user, userRole, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area. Required role: {requiredRole}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Current role: {userRole || 'none'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};