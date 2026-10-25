import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ArrowLeft, Edit3, DollarSign, User, ShieldAlert } from 'lucide-react';

export function Employee360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | salary

  // Salary edit state
  const [newSalary, setNewSalary] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryMsg, setSalaryMsg] = useState('');

  const isHrOrAdmin = ['admin', 'hr'].includes(user?.role);
  const isHr = user?.role === 'hr';

  const loadData = async () => {
    setLoading(true);
    try {
      const emp = await apiRequest(`/employees/${id}`);
      setEmployee(emp);

      if (isHrOrAdmin) {
        try {
          const sal = await apiRequest(`/employees/${id}/salary`);
          setSalary(sal);
          setNewSalary(sal.basicSalary);
        } catch (salErr) {
          console.warn('Salary not viewable:', salErr.message);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to load employee.');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    setSavingSalary(true);
    setSalaryMsg('');
    try {
      const updated = await apiRequest(`/employees/${id}/salary`, {
        method: 'PUT',
        body: JSON.stringify({ basicSalary: Number(newSalary) })
      });
      setSalary(updated);
      setSalaryMsg('Salary structure updated successfully.');
    } catch (err) {
      setSalaryMsg(err.message || 'Failed to update salary.');
    } finally {
      setSavingSalary(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to directory
        </Button>
      </div>

      {/* Header Banner */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-semibold text-lg border border-[var(--primary)]/20">
            {employee.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-[var(--text)]">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 space-x-2">
              <span className="font-mono tabular-nums">{employee.code}</span>
              <span>•</span>
              <span>{employee.designationId?.title || 'No designation'}</span>
              <span>•</span>
              <span>{employee.departmentId?.name || 'No department'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        <button
          onClick={() => setTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            tab === 'overview'
              ? 'border-[var(--primary)] text-[var(--primary)] font-medium'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Overview & info
        </button>
        {isHrOrAdmin && (
          <button
            onClick={() => setTab('salary')}
            className={`pb-3 border-b-2 transition-colors ${
              tab === 'salary'
                ? 'border-[var(--primary)] text-[var(--primary)] font-medium'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Salary structure
          </button>
        )}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Personal & contact details">
            <dl className="divide-y divide-[var(--border)] text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Email address</dt>
                <dd className="font-medium text-[var(--text)]">{employee.email}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Phone</dt>
                <dd className="font-medium text-[var(--text)] font-mono tabular-nums">{employee.phone || '—'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Address</dt>
                <dd className="font-medium text-[var(--text)]">{employee.address || '—'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Gender</dt>
                <dd className="capitalize font-medium text-[var(--text)]">{employee.gender}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Job & organization">
            <dl className="divide-y divide-[var(--border)] text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Department</dt>
                <dd className="font-medium text-[var(--text)]">{employee.departmentId?.name || '—'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Designation</dt>
                <dd className="font-medium text-[var(--text)]">{employee.designationId?.title || '—'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Join date</dt>
                <dd className="font-medium text-[var(--text)] font-mono tabular-nums">{employee.joinDate}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Exit date</dt>
                <dd className="font-medium text-[var(--text)] font-mono tabular-nums">{employee.exitDate || 'Active in service'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* Tab: Salary Structure */}
      {tab === 'salary' && salary && (
        <div className="max-w-xl space-y-4">
          <Card title="Monthly salary breakdown (PKR)">
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Per rule 3.6: Gross = 1.5 × Basic (HRA 40% + Medical 10%).
            </p>

            <dl className="divide-y divide-[var(--border)] text-sm mb-6">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Basic salary</dt>
                <dd className="font-mono tabular-nums font-semibold text-[var(--text)]">
                  PKR {salary.basicSalary.toLocaleString()}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">House rent allowance (HRA 40%)</dt>
                <dd className="font-mono tabular-nums text-[var(--text)]">
                  PKR {salary.hra.toLocaleString()}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[var(--text-muted)]">Medical allowance (10%)</dt>
                <dd className="font-mono tabular-nums text-[var(--text)]">
                  PKR {salary.medical.toLocaleString()}
                </dd>
              </div>
              <div className="py-3 flex justify-between bg-[var(--surface-muted)] px-3 rounded-lg font-semibold border border-[var(--border)]">
                <dt className="text-[var(--text)]">Total monthly gross</dt>
                <dd className="font-mono tabular-nums text-[var(--primary)] text-base">
                  PKR {salary.gross.toLocaleString()}
                </dd>
              </div>
            </dl>

            {isHr && (
              <form onSubmit={handleUpdateSalary} className="border-t border-[var(--border)] pt-4 space-y-3">
                {salaryMsg && (
                  <div className="p-3 bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20 text-xs rounded-lg font-medium">
                    {salaryMsg}
                  </div>
                )}
                <FormField label="Update basic salary (PKR)" required helperText="Gross will automatically recalculate.">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <Button type="submit" loading={savingSalary}>
                      Save salary
                    </Button>
                  </div>
                </FormField>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
