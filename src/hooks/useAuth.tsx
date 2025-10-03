import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Testing mode flag - set to true to bypass authentication
const TESTING_MODE = true;

// Mock data for testing mode
const MOCK_USER: User = {
  id: '12345678-1234-1234-1234-123456789abc',
  email: 'admin@test.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false
} as User;

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: MOCK_USER
} as Session;

export type UserRole = 'admin' | 'advisor' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isAdvisor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'user' as UserRole;
      }

      return data?.role as UserRole || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user' as UserRole;
    }
  };

  useEffect(() => {
    if (TESTING_MODE) {
      // In testing mode, set mock data immediately
      setUser(MOCK_USER);
      setSession(MOCK_SESSION);
      setUserRole('admin'); // Set as admin for full access
      setLoading(false);
      return;
    }

    // Normal Supabase auth flow
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role fetching to avoid blocking auth state changes
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(role => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (TESTING_MODE) {
      // In testing mode, always return success
      return { error: null };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (TESTING_MODE) {
      // In testing mode, always return success
      return { error: null };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (TESTING_MODE) {
      // In testing mode, always return success
      return { error: null };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Advisor has advisor permissions
    if (userRole === 'advisor' && (role === 'advisor' || role === 'user')) return true;
    
    // User only has user permissions
    if (userRole === 'user' && role === 'user') return true;
    
    return false;
  };

  const isAdmin = hasRole('admin');
  const isAdvisor = hasRole('advisor') || isAdmin;

  const value: AuthContextType = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    isAdvisor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};