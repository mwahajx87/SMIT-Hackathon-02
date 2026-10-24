import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { UserPlus, Key, ShieldCheck } from 'lucide-react';

export function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create HR Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [createLoading, setCreateLoading] = useState(false);

  // Temporary password display modal
  const [tempPassModal, setTempPassModal] = useState({ open: false, password: '', email: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, d, des] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/departments'),
        apiRequest('/designations')
      ]);
      setUsers(u);
      setDepartments(d);
      setDesignations(des);
      if (d.length > 0) setDepartmentId(d[0]._id);
      if (des.length > 0) setDesignationId(des[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHR = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const result = await apiRequest('/users/hr', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          departmentId,
          designationId,
          basicSalary: Number(basicSalary),
          joinDate
        })
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setBasicSalary('');
      setTempPassModal({ open: true, password: result.tempPassword, email: result.user.email });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create HR account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (id, userEmail) => {
    if (!confirm(`Reset password for ${userEmail}?`)) return;
    try {
      const result = await apiRequest(`/users/${id}/reset-password`, { method: 'POST' });
      setTempPassModal({ open: true, password: result.tempPassword, email: userEmail });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleDeactivate = async (id) => {
    try {
      await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F2A44]">Users & Logins</h1>
          <p className="text-xs text-[#6B7385] mt-1">
            Manage company administrator and HR team access credentials.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Create HR Login
        </Button>
      </div>

      <DataTable
        columns={[
          { header: 'Email', accessorKey: 'email' },
          {
            header: 'Role',
            cell: (row) => (
              <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-[#1F2A44]">
                {row.role}
              </span>
            )
          },
          {
            header: 'Status',
            cell: (row) => (
              <StatusBadge
                status={row.isActive ? 'active' : 'inactive'}
                label={row.isActive ? 'Active' : 'Deactivated'}
              />
            )
          },
          {
            header: 'Password Change',
            cell: (row) => (
              <span className="text-xs text-[#6B7385]">
                {row.mustChangePassword ? 'Required on first login' : 'Configured'}
              </span>
            )
          },
          {
            header: 'Actions',
            cell: (row) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleResetPassword(row._id, row.email)}
                  title="Reset Password"
                >
                  <Key className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
                {row.role !== 'admin' && (
                  <Button
                    size="sm"
                    variant={row.isActive ? 'danger' : 'secondary'}
                    onClick={() => handleToggleDeactivate(row._id)}
                  >
                    {row.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                )}
              </div>
            )
          }
        ]}
        data={users}
        loading={loading}
      />

      {/* Create HR Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create HR Team Member">
        <form onSubmit={handleCreateHR} className="space-y-4">
          <FormField label="Full Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Sarah Jenkins"
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
            />
          </FormField>

          <FormField label="Company Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="sarah@company.com"
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department" required>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Designation" required>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white"
              >
                {designations.map((des) => (
                  <option key={des._id} value={des._id}>
                    {des.title}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Basic Salary (PKR)" required>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                required
                placeholder="60000"
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Join Date" required>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm"
              />
            </FormField>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Create HR User
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-time Temp Password Modal */}
      <Modal
        isOpen={tempPassModal.open}
        onClose={() => setTempPassModal({ open: false, password: '', email: '' })}
        title="Temporary Password Generated"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B7385]">
            Copy this temporary password now for <strong>{tempPassModal.email}</strong>. It will not be shown again.
          </p>

          <div className="p-4 bg-gray-50 border border-dashed border-[#12A087] rounded-lg flex items-center justify-between">
            <code className="text-base font-mono font-bold text-[#1F2A44] select-all">
              {tempPassModal.password}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(tempPassModal.password);
                alert('Copied to clipboard!');
              }}
            >
              Copy
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setTempPassModal({ open: false, password: '', email: '' })}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
