import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { Role } from '@/types';

/**
 * Guards authenticated routes. Optionally restricts to specific roles
 * (e.g. admin-only Campaigns / Settings / Users).
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;

  // Signed in but no active profile row — fail safe (never redirect to /login,
  // which would ping-pong against LoginPage). Show a clear message instead.
  if (!profile || !profile.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
        <p className="max-w-sm text-sm text-brand-ink-600">
          Your account is signed in but has no active staff profile. Please contact an administrator.
        </p>
        <button className="btn-secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
