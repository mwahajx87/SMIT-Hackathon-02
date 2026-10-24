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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-[#12A087]/10 rounded-full text-[#12A087] mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2A44]">First-Run Company Setup</h1>
          <p className="text-sm text-[#6B7385] mt-1">Configure your organization and create the master Admin login.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${step === 1 ? 'bg-[#12A087] text-white' : 'bg-gray-200 text-[#6B7385]'}`}>
            1. Company Profile
          </div>
          <span className="text-gray-300">→</span>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${step === 2 ? 'bg-[#12A087] text-white' : 'bg-gray-200 text-[#6B7385]'}`}>
            2. Admin Account
          </div>
        </div>

        <Card>
          {error && (
            <div className="p-3 mb-4 bg-[#D64545]/10 border border-[#D64545]/20 rounded-lg text-xs text-[#D64545]">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <FormField label="Company Name" required helperText="e.g. Acme Industries Ltd.">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Acme Corporation"
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
              </FormField>

              <Button type="submit" className="w-full">
                Next: Setup Admin Account
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleFinishSetup} className="space-y-4">
              <FormField label="Admin Email" required>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@company.com"
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
              </FormField>

              <FormField label="Admin Password" required helperText="Minimum 6 characters">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
              </FormField>

              <FormField label="Confirm Password" required>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Complete Setup
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
