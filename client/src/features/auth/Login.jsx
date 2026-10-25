import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Lock, Mail } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[#0E8F7A] text-white flex items-center justify-center font-bold mx-auto mb-3 select-none">
            ▣
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">HCM Lite</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Sign in to your account</p>
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
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#0E8F7A]"
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
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[#0E8F7A]"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 stroke-[1.75]" />
              </div>
            </FormField>

            <Button type="submit" loading={loading} className="w-full h-10 mt-2">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

