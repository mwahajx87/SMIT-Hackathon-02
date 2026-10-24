import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { KeyRound } from 'lucide-react';

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      localStorage.setItem('hcm_token', res.token);
      updateUser((prev) => ({ ...prev, mustChangePassword: false }));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-[#E9962B]/10 rounded-full text-[#E9962B] mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1F2A44]">Change Temporary Password</h1>
          <p className="text-xs text-[#6B7385] mt-1">
            You must set a new secure password before accessing your account.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/20 rounded-lg text-xs text-[#D64545]">
                {error}
              </div>
            )}

            <FormField label="Current Password" required>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
              />
            </FormField>

            <FormField label="New Password" required helperText="Minimum 6 characters">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
              />
            </FormField>

            <Button type="submit" loading={loading} className="w-full">
              Update Password & Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
