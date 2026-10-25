import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Lock, Mail, BookOpen, Sparkles, Key } from 'lucide-react';

export function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState(location.state?.password || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.password) {
      setPassword(location.state.password);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold mx-auto mb-3 select-none shadow-sm">
            ▣
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">HCM Lite</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Sign in to your account</p>
        </div>

        {/* Teacher & Evaluator Banner */}
        <div className="rounded-xl p-3.5 bg-gradient-to-r from-[var(--primary-soft)] to-[var(--ai-soft)] border border-[var(--primary)]/20 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-semibold text-[var(--text)] block truncate">Teacher & Evaluator Portal</span>
              <span className="text-[var(--text-muted)] text-[11px] block">View app walkthrough & credentials</span>
            </div>
          </div>
          <Link
            to="/intro"
            className="px-2.5 py-1 rounded-md bg-[var(--surface)] text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-semibold hover:bg-[var(--primary)] hover:text-white transition-all shrink-0"
          >
            Open /intro
          </Link>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)] font-normal">
                {error}
              </div>
            )}

            <FormField label="Email" required>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 stroke-[1.75]" />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 stroke-[1.75]" />
              </div>
            </FormField>

            {/* Quick-fill Pills for Evaluators */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-[var(--primary)]" /> Quick Fill Demo:
                </span>
                <Link to="/intro" className="text-[var(--primary)] hover:underline">
                  Credentials Guide
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillDemo('wahajwahaj200@gmail.com', '12345678')}
                  className="px-2 py-1.5 rounded-md text-[11px] font-semibold border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('sarah@gmail.com', '12345678')}
                  className="px-2 py-1.5 rounded-md text-[11px] font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer text-center"
                >
                  HR
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('john@gmail.com', '12345678')}
                  className="px-2 py-1.5 rounded-md text-[11px] font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer text-center"
                >
                  Employee
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full h-10 mt-3">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Login;
