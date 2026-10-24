import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { User, Phone, MapPin, CheckCircle } from 'lucide-react';

export function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest('/auth/me');
        setProfile(data);
        if (data.employeeId) {
          setPhone(data.employeeId.phone || '');
          setAddress(data.employeeId.address || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await apiRequest('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ phone, address })
      });
      setSuccessMsg('Your profile has been updated.');
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const emp = profile?.employeeId;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1F2A44]">My Profile</h1>
        <p className="text-xs text-[#6B7385] mt-1">
          View your employment details and keep your contact details updated.
        </p>
      </div>

      <Card title="Personal Information">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E3E7EE] text-sm">
            <div>
              <span className="text-xs text-[#6B7385] block">Employee Name</span>
              <span className="font-semibold text-[#1F2A44]">{emp?.name || profile?.email}</span>
            </div>
            <div>
              <span className="text-xs text-[#6B7385] block">Employee Code</span>
              <span className="font-mono font-semibold text-[#1F2A44]">{emp?.code || '-'}</span>
            </div>
            <div>
              <span className="text-xs text-[#6B7385] block">Email Address (Read-only)</span>
              <span className="text-[#1F2A44]">{profile?.email}</span>
            </div>
            <div>
              <span className="text-xs text-[#6B7385] block">Role</span>
              <span className="capitalize font-semibold text-[#12A087]">{profile?.role}</span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-[#2E9E5B]/10 text-[#2E9E5B] border border-[#2E9E5B]/20 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <FormField label="Phone Number" helperText="Your direct contact number">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Residential Address" helperText="Your current mailing address">
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Apartment #, Street, City"
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={saving}>
                Save Contact Details
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
