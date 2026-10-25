import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export function OrganizationScreen() {
  const [tab, setTab] = useState('rules'); // rules | departments | designations | leave | holidays
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Department form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // Designation form
  const [desigTitle, setDesigTitle] = useState('');

  // Holiday form
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d, des, l, h] = await Promise.all([
        apiRequest('/settings'),
        apiRequest('/departments'),
        apiRequest('/designations'),
        apiRequest('/leave-types'),
        apiRequest('/holidays')
      ]);
      setSettings(s);
      setDepartments(d);
      setDesignations(des);
      setLeaveTypes(l);
      setHolidays(h);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setStatusMessage('Settings saved successfully.');
    } catch (err) {
      setStatusMessage(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setSettings((prev) => ({
          ...prev,
          officeLat: Number(pos.coords.latitude.toFixed(6)),
          officeLng: Number(pos.coords.longitude.toFixed(6))
        }));
      });
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify({ name: deptName, code: deptCode })
      });
      setDeptName('');
      setDeptCode('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await apiRequest(`/departments/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDesig = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/designations', {
        method: 'POST',
        body: JSON.stringify({ title: desigTitle })
      });
      setDesigTitle('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDesig = async (id) => {
    if (!confirm('Delete this designation?')) return;
    try {
      await apiRequest(`/designations/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/holidays', {
        method: 'POST',
        body: JSON.stringify({ date: holidayDate, name: holidayName })
      });
      setHolidayDate('');
      setHolidayName('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)] leading-8">Organization</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Configure company rules, geofence, departments, designations, leave types, and holidays.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-sm font-medium">
        {[
          { id: 'rules', label: 'Company & rules' },
          { id: 'departments', label: 'Departments' },
          { id: 'designations', label: 'Designations' },
          { id: 'leave', label: 'Leave types' },
          { id: 'holidays', label: 'Public holidays' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 transition-colors border-b-2 font-medium cursor-pointer ${
              tab === t.id
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && settings && (
        <Card title="Working hours and geofence">
          {statusMessage && (
            <div className="mb-4 p-3 bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20 rounded-lg text-xs font-medium">
              {statusMessage}
            </div>
          )}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Office start time" helperText="Default 09:00">
                <input
                  type="time"
                  value={settings.officeStart || '09:00'}
                  onChange={(e) => setSettings({ ...settings, officeStart: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Grace period (minutes)" helperText="Late after this (Default 15 min)">
                <input
                  type="number"
                  value={settings.graceMinutes ?? 15}
                  onChange={(e) => setSettings({ ...settings, graceMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Half day threshold (hours)" helperText="Worked under this = half day (Default 5h)">
                <input
                  type="number"
                  step="0.5"
                  value={settings.halfDayHours ?? 5}
                  onChange={(e) => setSettings({ ...settings, halfDayHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Minimum full day (hours)" helperText="Default 8h">
                <input
                  type="number"
                  step="0.5"
                  value={settings.fullDayHours ?? 8}
                  onChange={(e) => setSettings({ ...settings, fullDayHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Timezone">
                <input
                  type="text"
                  value={settings.timezone || 'Asia/Karachi'}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Office latitude">
                <input
                  type="number"
                  step="any"
                  value={settings.officeLat || ''}
                  onChange={(e) => setSettings({ ...settings, officeLat: e.target.value ? Number(e.target.value) : null })}
                  placeholder="24.8607"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Office longitude">
                <input
                  type="number"
                  step="any"
                  value={settings.officeLng || ''}
                  onChange={(e) => setSettings({ ...settings, officeLng: e.target.value ? Number(e.target.value) : null })}
                  placeholder="67.0011"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <FormField label="Office radius (meters)" helperText="Default 150m">
                <input
                  type="number"
                  value={settings.officeRadiusM ?? 150}
                  onChange={(e) => setSettings({ ...settings, officeRadiusM: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </FormField>

              <div className="flex items-end pb-1.5">
                <Button type="button" variant="secondary" onClick={handleUseLocation} className="w-full">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  Use my current location
                </Button>
              </div>
            </div>

            {/* Late Penalty Rule (Phase 10 T10.2) */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="latePenaltyToggle"
                checked={Boolean(settings.latePenaltyEnabled)}
                onChange={(e) => setSettings({ ...settings, latePenaltyEnabled: e.target.checked })}
                className="mt-1 h-4 w-4 text-[var(--primary)] rounded border-[var(--border)] focus:ring-[var(--primary)]"
              />
              <label htmlFor="latePenaltyToggle" className="cursor-pointer text-sm">
                <span className="font-semibold text-[var(--text)] block">
                  Enable late penalty rule (3 lates = 0.5 day deduction)
                </span>
                <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                  When enabled, every 3 late arrivals in a payroll month automatically add 0.5 days to the employee&apos;s payroll deductions.
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex justify-end">
              <Button type="submit" loading={saving}>
                Save rules
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <div className="space-y-4">
          <Card title="Add department">
            <form onSubmit={handleCreateDept} className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Department name (e.g. Engineering)"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <input
                type="text"
                placeholder="Code (e.g. ENG)"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                required
                className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <Button type="submit">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </form>
          </Card>

          <DataTable
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Code', accessorKey: 'code' },
              {
                header: 'Actions',
                cell: (row) => (
                  <button
                    onClick={() => handleDeleteDept(row._id)}
                    className="text-[var(--danger)] hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              }
            ]}
            data={departments}
            loading={loading}
            emptyTitle="No departments found"
            emptyDescription="Create your first department above."
          />
        </div>
      )}

      {/* Designations Tab */}
      {tab === 'designations' && (
        <div className="space-y-4">
          <Card title="Add designation">
            <form onSubmit={handleCreateDesig} className="flex gap-3">
              <input
                type="text"
                placeholder="Title (e.g. Software Engineer)"
                value={desigTitle}
                onChange={(e) => setDesigTitle(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <Button type="submit">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </form>
          </Card>

          <DataTable
            columns={[
              { header: 'Title', accessorKey: 'title' },
              {
                header: 'Actions',
                cell: (row) => (
                  <button
                    onClick={() => handleDeleteDesig(row._id)}
                    className="text-[var(--danger)] hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              }
            ]}
            data={designations}
            loading={loading}
            emptyTitle="No designations"
            emptyDescription="Add a job title above."
          />
        </div>
      )}

      {/* Leave Types Tab */}
      {tab === 'leave' && (
        <DataTable
          columns={[
            { header: 'Key', accessorKey: 'key' },
            { header: 'Name', accessorKey: 'name' },
            {
              header: 'Yearly quota',
              cell: (row) => (row.yearlyQuota === null ? 'Unlimited' : `${row.yearlyQuota} days`)
            },
            {
              header: 'Paid',
              cell: (row) => (row.isPaid ? 'Yes' : 'No')
            }
          ]}
          data={leaveTypes}
          loading={loading}
        />
      )}

      {/* Holidays Tab */}
      {tab === 'holidays' && (
        <div className="space-y-4">
          <Card title="Add public holiday">
            <form onSubmit={handleCreateHoliday} className="flex flex-col md:flex-row gap-3">
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                required
                className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <input
                type="text"
                placeholder="Holiday name (e.g. Independence Day)"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <Button type="submit">
                <Plus className="w-4 h-4 mr-1" /> Add holiday
              </Button>
            </form>
          </Card>

          <DataTable
            columns={[
              { header: 'Date', accessorKey: 'date' },
              { header: 'Holiday name', accessorKey: 'name' },
              {
                header: 'Actions',
                cell: (row) => (
                  <button
                    onClick={() => handleDeleteHoliday(row._id)}
                    className="text-[var(--danger)] hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              }
            ]}
            data={holidays}
            loading={loading}
            emptyTitle="No public holidays set"
            emptyDescription="Add company holidays to exclude them from leave calculations."
          />
        </div>
      )}
    </div>
  );
}
