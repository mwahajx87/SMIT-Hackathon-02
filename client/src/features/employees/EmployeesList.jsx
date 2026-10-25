import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { CsvImportModal } from './CsvImportModal.jsx';
import { UserPlus, Upload, Download, Search, Filter, Eye } from 'lucide-react';

export function EmployeesList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Add Employee Drawer/Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addGender, setAddGender] = useState('other');
  const [addDept, setAddDept] = useState('');
  const [addDesig, setAddDesig] = useState('');
  const [addSalary, setAddSalary] = useState('');
  const [addJoinDate, setAddJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [addLoading, setAddLoading] = useState(false);

  // Temporary password modal
  const [tempPassModal, setTempPassModal] = useState({ open: false, password: '', code: '' });

  // CSV import modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', page);
      params.append('limit', 10);

      const [empRes, depts, desigs] = await Promise.all([
        apiRequest(`/employees?${params.toString()}`),
        departments.length === 0 ? apiRequest('/departments') : Promise.resolve(departments),
        designations.length === 0 ? apiRequest('/designations') : Promise.resolve(designations)
      ]);

      setEmployees(empRes.items || []);
      setPagination(empRes.pagination || { total: 0, totalPages: 1 });

      if (departments.length === 0) {
        setDepartments(depts);
        if (depts.length > 0) setAddDept(depts[0]._id);
      }
      if (designations.length === 0) {
        setDesignations(desigs);
        if (desigs.length > 0) setAddDesig(desigs[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus, page]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
          address: addAddress,
          gender: addGender,
          departmentId: addDept,
          designationId: addDesig,
          basicSalary: Number(addSalary),
          joinDate: addJoinDate
        })
      });

      setIsAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddSalary('');
      setTempPassModal({ open: true, password: res.tempPassword, code: res.employee.code });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add employee');
    } finally {
      setAddLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/employees/export', '_blank');
  };

  const isHr = user?.role === 'hr';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">Employees</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage everyone in your company.
          </p>
        </div>

        {isHr && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCsvModalOpen(true)} className="h-9">
              <Upload className="w-4 h-4 mr-1.5 stroke-[1.75]" /> Import CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCsv} className="h-9">
              <Download className="w-4 h-4 mr-1.5 stroke-[1.75]" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="h-9">
              <UserPlus className="w-4 h-4 mr-1.5 stroke-[1.75]" /> Add employee
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)] transition-colors">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, code or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 stroke-[1.75]" />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      {/* Employee Table */}
      <DataTable
        emptyTitle="No employees yet"
        emptyDescription="Add your first employee to create their login."
        emptyActionLabel={isHr ? "Add employee" : undefined}
        onEmptyAction={isHr ? () => setIsAddModalOpen(true) : undefined}
        columns={[
          {
            header: 'Code',
            accessorKey: 'code',
            cell: (row) => <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text)]">{row.code}</span>
          },
          {
            header: 'Name',
            cell: (row) => (
              <div>
                <span className="font-semibold text-sm text-[var(--text)] block">{row.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{row.email}</span>
              </div>
            )
          },
          {
            header: 'Department',
            cell: (row) => row.departmentId?.name || '-'
          },
          {
            header: 'Designation',
            cell: (row) => row.designationId?.title || '-'
          },
          {
            header: 'Status',
            cell: (row) => <StatusBadge status={row.status} />
          },
          {
            header: 'Actions',
            cell: (row) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/employees/${row._id}`)}
              >
                <Eye className="w-4 h-4 mr-1" /> View 360
              </Button>
            )
          }
        ]}
        data={employees}
        loading={loading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2">
          <span>Total {pagination.total} employees</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="self-center font-medium tabular-nums">Page {page} of {pagination.totalPages}</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register new employee" maxWidth="max-w-xl">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full name" required>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>

            <FormField label="Email address" required>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department" required>
              <select
                value={addDept}
                onChange={(e) => setAddDept(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
                value={addDesig}
                onChange={(e) => setAddDesig(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {designations.map((des) => (
                  <option key={des._id} value={des._id}>
                    {des.title}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Basic salary (PKR)" required>
              <input
                type="number"
                value={addSalary}
                onChange={(e) => setAddSalary(e.target.value)}
                required
                placeholder="60000"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>

            <FormField label="Join date" required>
              <input
                type="date"
                value={addJoinDate}
                onChange={(e) => setAddJoinDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>

            <FormField label="Gender">
              <select
                value={addGender}
                onChange={(e) => setAddGender(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone number">
              <input
                type="text"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>

            <FormField label="Address">
              <input
                type="text"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="Karachi, Pakistan"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </FormField>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addLoading}>
              Register employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* One-time Temp Password Modal */}
      <Modal
        isOpen={tempPassModal.open}
        onClose={() => setTempPassModal({ open: false, password: '', code: '' })}
        title="Employee registered successfully"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Hand over this temporary password to <strong>{tempPassModal.code}</strong>. They will be prompted to change it upon first login.
          </p>

          <div className="p-4 bg-[var(--primary-soft)] border border-dashed border-[var(--primary)] rounded-lg flex items-center justify-between">
            <code className="text-base font-mono font-semibold text-[var(--text)] select-all">
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
            <Button onClick={() => setTempPassModal({ open: false, password: '', code: '' })}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
