import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import logo from '@/assets/logo.png';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [ready, setReady] = useState(false); // recovery session established
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    // The recovery token in the URL is consumed by supabase-js on load; a
    // session (or the PASSWORD_RECOVERY event) means we can set a new password.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      toast.success('Password updated. You are signed in.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logo} alt="Expert Dental Center" className="h-20 w-20 object-contain" />
          <h1 className="mt-4 text-xl font-bold text-brand-ink-800">Set a new password</h1>
        </div>

        {checking ? (
          <div className="card flex justify-center p-8">
            <Spinner className="h-7 w-7" />
          </div>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <div>
              <label htmlFor="rp_pw" className="mb-1 block text-sm font-medium text-brand-ink-700">
                New password
              </label>
              <input
                id="rp_pw"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rp_cf" className="mb-1 block text-sm font-medium text-brand-ink-700">
                Confirm password
              </label>
              <input
                id="rp_cf"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 text-white" /> : 'Update password'}
            </button>
          </form>
        ) : (
          <div className="card space-y-3 p-6 text-center">
            <p className="text-sm text-brand-ink-600">
              This reset link is invalid or has expired. Please request a new one from the sign-in
              page.
            </p>
            <Link to="/login" className="btn-secondary inline-flex">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
