import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { Download, AlertCircle } from 'lucide-react';

export function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('/payslips');
      setPayslips(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load your payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownload = (runId, employeeId, month) => {
    const token = localStorage.getItem('hcm_token');
    const url = `/api/payslips/${runId}/${employeeId}/pdf`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate payslip PDF');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `payslip-${month}.pdf`;
        link.click();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">My payslips</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">View and download your monthly salary statements</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : payslips.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="No payslips available"
            description="Your payslips will appear here once official monthly payroll runs are finalized by admin."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {payslips.map(({ runId, month, finalizedAt, payslip }) => (
            <Card key={runId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[var(--primary)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-base text-[var(--text)]">{month}</span>
                  <StatusBadge status="finalized" />
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                  Basic: PKR {payslip.basicSalary?.toLocaleString()} • Gross: PKR {payslip.grossSalary?.toLocaleString()} • Working days: {payslip.workingDaysInMonth}
                </p>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-1 font-mono tabular-nums">
                  <span>Deductions: <strong className="text-rose-600 dark:text-rose-400 font-medium">-PKR {payslip.deductionAmount?.toLocaleString() || '0'}</strong></span>
                  <span>Tax: <strong>PKR {payslip.monthlyTax?.toLocaleString() || '0'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                <div className="text-left md:text-right">
                  <span className="text-xs font-medium text-[var(--text-muted)] block">Net take-home pay</span>
                  <span className="text-xl font-semibold text-[var(--primary)] font-mono tabular-nums">
                    PKR {payslip.netSalary?.toLocaleString()}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(runId, payslip.employeeId, month)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
