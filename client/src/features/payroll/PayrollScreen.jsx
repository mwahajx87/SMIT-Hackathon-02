import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  CircleDollarSign,
  Plus,
  RefreshCw,
  Lock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export function PayrollScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [monthInput, setMonthInput] = useState(new Date().toISOString().slice(0, 7));
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Finalize Confirmation Modal
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/payroll/runs?limit=50');
      setRuns(res?.items || []);
      if (res?.items?.length > 0 && !selectedRun) {
        loadRunDetail(res.items[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetail = async (id) => {
    try {
      setDetailLoading(true);
      const res = await apiRequest(`/payroll/runs/${id}`);
      setSelectedRun(res);
    } catch (err) {
      alert(err.message || 'Failed to load payroll details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleCreateRun = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setSubmitting(true);
    try {
      const res = await apiRequest('/payroll/runs', {
        method: 'POST',
        body: JSON.stringify({ month: monthInput })
      });
      setShowCreateModal(false);
      await fetchRuns();
      loadRunDetail(res._id);
    } catch (err) {
      setCreateError(err.message || 'Failed to generate draft run');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedRun) return;
    if (!window.confirm(`Regenerate payroll draft for ${selectedRun.month}? This will re-calculate attendance and leaves.`)) return;
    try {
      setDetailLoading(true);
      const res = await apiRequest(`/payroll/runs/${selectedRun._id}/regenerate`, { method: 'POST' });
      setSelectedRun(res);
      fetchRuns();
    } catch (err) {
      alert(err.message || 'Failed to regenerate run');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedRun) return;
    setFinalizing(true);
    try {
      const res = await apiRequest(`/payroll/runs/${selectedRun._id}/finalize`, { method: 'POST' });
      setSelectedRun(res);
      setShowFinalizeModal(false);
      fetchRuns();
    } catch (err) {
      alert(err.message || 'Failed to finalize run');
    } finally {
      setFinalizing(false);
    }
  };

  const handleDownloadPdf = (employeeId) => {
    const token = localStorage.getItem('hcm_token');
    const url = `/api/payslips/${selectedRun._id}/${employeeId}/pdf`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `payslip-${selectedRun.month}.pdf`;
        link.click();
      })
      .catch((err) => alert('Failed to download PDF: ' + err.message));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Payroll</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Generate monthly salary drafts, review itemized breakdowns, and finalize runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Generate draft</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Runs List on Left, Selected Run Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs Navigation Column */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text)]">Payroll periods</h2>
              <Button variant="ghost" size="sm" onClick={fetchRuns} className="p-1.5 h-auto text-[var(--text-muted)]">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-2 pt-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : runs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                No payroll runs created yet. Click "Generate draft" to start.
              </div>
            ) : (
              <div className="space-y-2 pt-3">
                {runs.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => loadRunDetail(r._id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                      selectedRun?._id === r._id
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                        : 'border-[var(--border)] hover:bg-[var(--surface-muted)] bg-[var(--surface)] text-[var(--text)]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm text-[var(--text)]">{r.month}</div>
                      <div className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                        PKR {r.totalNet?.toLocaleString() || '0'} • {r.totalEmployees} employees
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Run Details & Employees Line Items */}
        <div className="lg:col-span-2 space-y-4">
          {detailLoading ? (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </Card>
          ) : !selectedRun ? (
            <Card className="p-12 text-center">
              <EmptyState
                title="Select a payroll run"
                description="Choose a payroll period from the list on the left to inspect payslip details."
              />
            </Card>
          ) : (
            <>
              {/* Run Summary Header */}
              <Card className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--text)]">
                        Period: {selectedRun.month}
                      </h2>
                      <StatusBadge status={selectedRun.status} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Created by {selectedRun.createdBy?.email || 'System'}
                      {selectedRun.status === 'finalized' && (
                        <span> • Finalized on {new Date(selectedRun.finalizedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRun.status === 'draft' ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleRegenerate}
                          className="flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => setShowFinalizeModal(true)}
                            className="flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Finalize run</span>
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs font-medium border border-[var(--border)]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked & finalized</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* KPI chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)]">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Employees</span>
                    <div className="text-xl font-semibold text-[var(--text)] mt-1 font-mono tabular-nums">{selectedRun.totalEmployees}</div>
                  </div>
                  <div className="p-3 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)]">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Total gross</span>
                    <div className="text-xl font-semibold text-[var(--text)] mt-1 font-mono tabular-nums">
                      PKR {selectedRun.totalGross?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)]">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Total deductions</span>
                    <div className="text-xl font-semibold text-rose-600 dark:text-rose-400 mt-1 font-mono tabular-nums">
                      - PKR {selectedRun.totalDeductions?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--primary-soft)] rounded-lg border border-[var(--primary)]/20">
                    <span className="text-xs font-medium text-[var(--primary)]">Total net disbursement</span>
                    <div className="text-xl font-semibold text-[var(--primary)] mt-1 font-mono tabular-nums">
                      PKR {selectedRun.totalNet?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Items Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Itemized employee payslips</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium border-b border-[var(--border)]">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Basic</th>
                        <th className="px-4 py-3">Gross (1.5x)</th>
                        <th className="px-4 py-3">Ded. days</th>
                        <th className="px-4 py-3">Deductions</th>
                        <th className="px-4 py-3">Tax</th>
                        <th className="px-4 py-3">Net pay</th>
                        <th className="px-4 py-3 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {selectedRun.items?.map((item) => (
                        <tr key={item._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text)]">{item.employeeName}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{item.employeeCode} • {item.departmentName}</div>
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[var(--text)]">{item.basicSalary?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[var(--text)]">{item.grossSalary?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-muted)]">
                            {item.deductionDays}d
                            <span className="text-[10px] block text-[var(--text-muted)]">
                              (abs:{item.absentDays}, unp:{item.unpaidLeaveDays}, hlf:{item.halfDays}{item.latePenaltyDays ? `, latePen:+${item.latePenaltyDays}d` : ''})
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                            {item.deductionAmount > 0 ? `-${item.deductionAmount.toLocaleString()}` : '0'}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-[var(--text-muted)]">{item.monthlyTax?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-3 font-mono tabular-nums font-semibold text-[var(--primary)]">
                            PKR {item.netSalary?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDownloadPdf(item.employeeId)}
                              title="Download payslip PDF"
                              className="text-[var(--text-muted)] hover:text-[var(--primary)] p-1.5 rounded transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Create Run Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate payroll draft"
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text)] mb-1">
              Select payroll month <span className="text-[var(--text-muted)]">(required)</span>
            </label>
            <input
              type="month"
              required
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              The engine will compute working days, attendance deductions, approved unpaid leaves, and income tax slabs automatically.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate draft'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finalize Confirmation Modal */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize payroll run"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <strong>Warning:</strong> Finalizing this payroll run will permanently lock it.
            No further modifications or regenerations can be made, and official payslips will become accessible to employees.
          </div>

          <p className="text-sm text-[var(--text)]">
            Are you sure you want to finalize the payroll run for <strong>{selectedRun?.month}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFinalizeModal(false)}
              disabled={finalizing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
            >
              {finalizing ? 'Finalizing...' : 'Yes, lock & finalize'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
