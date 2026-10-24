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
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1F2A44] tracking-tight">HCM Lite</h1>
          <p className="text-sm text-[#6B7385] mt-1">Sign in to your Human Capital Management account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/20 rounded-lg text-xs text-[#D64545] font-medium">
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
                  className="w-full pl-9 pr-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
                <Mail className="w-4 h-4 text-[#6B7385] absolute left-3 top-2.5" />
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
                  className="w-full pl-9 pr-3 py-2 border border-[#E3E7EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#12A087]"
                />
                <Lock className="w-4 h-4 text-[#6B7385] absolute left-3 top-2.5" />
              </div>
            </FormField>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
