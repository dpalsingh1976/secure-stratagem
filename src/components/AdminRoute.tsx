import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'advisor' | 'user';
}

export const AdminRoute = ({ children, requiredRole = 'user' }: AdminRouteProps) => {
  const { user, userRole, loading, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area. Required role: {requiredRole}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Signed in as: <span className="font-medium">{user.email}</span> ({userRole || 'none'})
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate('/auth?redirect=/admin');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out & Switch Account
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};