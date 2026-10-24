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
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Directory
        </Button>
      </div>

      {/* Header Banner */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#12A087]/15 text-[#12A087] flex items-center justify-center font-bold text-xl">
            {employee.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1F2A44]">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <div className="text-xs text-[#6B7385] mt-1 space-x-3">
              <span className="font-mono font-semibold">{employee.code}</span>
              <span>•</span>
              <span>{employee.designationId?.title || 'No Designation'}</span>
              <span>•</span>
              <span>{employee.departmentId?.name || 'No Department'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[#E3E7EE] gap-6 text-sm font-medium">
        <button
          onClick={() => setTab('overview')}
          className={`pb-3 border-b-2 ${
            tab === 'overview'
              ? 'border-[#12A087] text-[#12A087]'
              : 'border-transparent text-[#6B7385] hover:text-[#1F2A44]'
          }`}
        >
          Overview & Info
        </button>
        {isHrOrAdmin && (
          <button
            onClick={() => setTab('salary')}
            className={`pb-3 border-b-2 ${
              tab === 'salary'
                ? 'border-[#12A087] text-[#12A087]'
                : 'border-transparent text-[#6B7385] hover:text-[#1F2A44]'
            }`}
          >
            Salary Structure
          </button>
        )}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Personal & Contact Details">
            <dl className="divide-y divide-[#E3E7EE] text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Email Address</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.email}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Phone</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.phone || '-'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Address</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.address || '-'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Gender</dt>
                <dd className="capitalize font-medium text-[#1F2A44]">{employee.gender}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Job & Organization">
            <dl className="divide-y divide-[#E3E7EE] text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Department</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.departmentId?.name || '-'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Designation</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.designationId?.title || '-'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Join Date</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.joinDate}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Exit Date</dt>
                <dd className="font-medium text-[#1F2A44]">{employee.exitDate || 'Active in service'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {/* Tab: Salary Structure */}
      {tab === 'salary' && salary && (
        <div className="max-w-xl space-y-4">
          <Card title="Monthly Salary Breakdown (PKR)">
            <p className="text-xs text-[#6B7385] mb-4">
              Per Rule 3.6: Gross = 1.5 × Basic (HRA 40% + Medical 10%).
            </p>

            <dl className="divide-y divide-[#E3E7EE] text-sm mb-6">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Basic Salary</dt>
                <dd className="font-mono font-bold text-[#1F2A44]">
                  PKR {salary.basicSalary.toLocaleString()}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">House Rent Allowance (HRA 40%)</dt>
                <dd className="font-mono font-medium text-[#1F2A44]">
                  PKR {salary.hra.toLocaleString()}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7385]">Medical Allowance (10%)</dt>
                <dd className="font-mono font-medium text-[#1F2A44]">
                  PKR {salary.medical.toLocaleString()}
                </dd>
              </div>
              <div className="py-3 flex justify-between bg-gray-50 px-3 rounded-lg font-bold">
                <dt className="text-[#1F2A44]">Total Monthly Gross</dt>
                <dd className="font-mono text-[#12A087] text-base">
                  PKR {salary.gross.toLocaleString()}
                </dd>
              </div>
            </dl>

            {isHr && (
              <form onSubmit={handleUpdateSalary} className="border-t border-[#E3E7EE] pt-4 space-y-3">
                {salaryMsg && (
                  <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">
                    {salaryMsg}
                  </div>
                )}
                <FormField label="Update Basic Salary (PKR)" required helperText="Gross will automatically recalculate.">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
                    />
                    <Button type="submit" loading={savingSalary}>
                      Save Salary
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
