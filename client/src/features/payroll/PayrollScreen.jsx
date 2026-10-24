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
          <h1 className="text-2xl font-bold text-[#1F2A44]">Payroll Management</h1>
          <p className="text-sm text-[#6B7385]">
            Generate monthly salary drafts, review itemized breakdowns, and finalize runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Payroll Run</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Runs List on Left, Selected Run Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs Navigation Column */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
              <h2 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider">Payroll Periods</h2>
              <Button variant="ghost" size="sm" onClick={fetchRuns} className="p-1.5 h-auto text-[#6B7385]">
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
              <div className="py-6 text-center text-xs text-[#6B7385]">
                No payroll runs created yet. Click "New Payroll Run" to start.
              </div>
            ) : (
              <div className="space-y-2 pt-3">
                {runs.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => loadRunDetail(r._id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                      selectedRun?._id === r._id
                        ? 'border-[#12A087] bg-[#12A087]/5 ring-1 ring-[#12A087]'
                        : 'border-[#E3E7EE] hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-[#1F2A44]">{r.month}</div>
                      <div className="text-xs text-[#6B7385]">
                        PKR {r.totalNet?.toLocaleString() || '0'} • {r.totalEmployees} employees
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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
                title="Select a Payroll Run"
                description="Choose a payroll period from the list on the left to inspect payslip details."
              />
            </Card>
          ) : (
            <>
              {/* Run Summary Header */}
              <Card className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3E7EE]">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-[#1F2A44]">
                        Period: {selectedRun.month}
                      </h2>
                      <StatusBadge status={selectedRun.status} />
                    </div>
                    <p className="text-xs text-[#6B7385] mt-1">
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
                          variant="outline"
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
                            className="bg-[#12A087] hover:bg-[#0E806C] text-white flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Finalize Run</span>
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked & Finalized</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KPI chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-semibold text-[#6B7385] uppercase">Employees</span>
                    <div className="text-lg font-bold text-[#1F2A44]">{selectedRun.totalEmployees}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-semibold text-[#6B7385] uppercase">Gross Total</span>
                    <div className="text-lg font-bold text-[#1F2A44]">
                      PKR {selectedRun.totalGross?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-semibold text-[#6B7385] uppercase">Total Deductions</span>
                    <div className="text-lg font-bold text-red-600">
                      - PKR {selectedRun.totalDeductions?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase">Net Disbursement</span>
                    <div className="text-lg font-extrabold text-[#12A087]">
                      PKR {selectedRun.totalNet?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Items Table */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-[#E3E7EE]">
                  <h3 className="text-sm font-bold text-[#1F2A44]">Itemized Employee Payslips</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#6B7385] uppercase font-semibold border-b border-[#E3E7EE]">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Basic</th>
                        <th className="px-4 py-3">Gross (1.5x)</th>
                        <th className="px-4 py-3">Ded. Days</th>
                        <th className="px-4 py-3">Deductions</th>
                        <th className="px-4 py-3">Tax</th>
                        <th className="px-4 py-3">Net Pay</th>
                        <th className="px-4 py-3 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E7EE]">
                      {selectedRun.items?.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#1F2A44]">{item.employeeName}</div>
                            <div className="text-[10px] text-[#6B7385]">{item.employeeCode} • {item.departmentName}</div>
                          </td>
                          <td className="px-4 py-3 text-[#1F2A44]">{item.basicSalary?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium text-[#1F2A44]">{item.grossSalary?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-[#6B7385]">
                            {item.deductionDays}d
                            <span className="text-[9px] block text-gray-400">
                              (abs:{item.absentDays}, unp:{item.unpaidLeaveDays}, hlf:{item.halfDays}{item.latePenaltyDays ? `, latePen:+${item.latePenaltyDays}d (${item.lateDays} lates)` : ''})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-red-600 font-medium">
                            {item.deductionAmount > 0 ? `-${item.deductionAmount.toLocaleString()}` : '0'}
                          </td>
                          <td className="px-4 py-3 text-[#6B7385]">{item.monthlyTax?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-3 font-bold text-[#12A087]">
                            PKR {item.netSalary?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDownloadPdf(item.employeeId)}
                              title="Download Payslip PDF"
                              className="text-gray-500 hover:text-[#12A087] p-1 rounded"
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
        title="Generate Payroll Draft"
      >
        <form onSubmit={handleCreateRun} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2A44] uppercase mb-1">
              Select Payroll Month (YYYY-MM)
            </label>
            <input
              type="month"
              required
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#12A087]"
            />
            <p className="text-xs text-[#6B7385] mt-1">
              The engine will compute working days, attendance deductions, approved unpaid leaves, and income tax slabs automatically.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate Draft'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finalize Confirmation Modal */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize Payroll Run"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs leading-relaxed">
            <strong>Warning:</strong> Finalizing this payroll run will permanently lock it.
            No further modifications or regenerations can be made, and official payslips will become accessible to employees.
          </div>

          <p className="text-sm text-[#1F2A44]">
            Are you sure you want to finalize the payroll run for <strong>{selectedRun?.month}</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFinalizeModal(false)}
              disabled={finalizing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={finalizing}
              className="bg-[#12A087] hover:bg-[#0E806C] text-white"
            >
              {finalizing ? 'Finalizing...' : 'Yes, Lock & Finalize'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
