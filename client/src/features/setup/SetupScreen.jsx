import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Building2, ShieldCheck } from 'lucide-react';

export function SetupScreen() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please provide a company name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinishSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/setup', {
        method: 'POST',
        body: JSON.stringify({ companyName, adminEmail, adminPassword })
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold mx-auto mb-3 select-none">
            <Building2 className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">First-run company setup</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Configure your organization and create the master admin login.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${step === 1 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
            1. Company profile
          </div>
          <span className="text-[var(--text-muted)] text-xs select-none">→</span>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${step === 2 ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
            2. Admin account
          </div>
        </div>

        <Card>
          {error && (
            <div className="p-3 mb-4 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <FormField label="Company name" required helperText="e.g. Acme Industries Ltd.">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Acme Corporation"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <Button type="submit" className="w-full h-10">
                Continue to admin account
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleFinishSetup} className="space-y-4">
              <FormField label="Admin email" required>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@company.com"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Admin password" required helperText="Minimum 6 characters">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Confirm password" required>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1 h-10">
                  Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1 h-10">
                  Complete setup
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
