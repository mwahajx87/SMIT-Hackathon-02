import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { apiRequest } from '../../lib/api.js';
import { FileText, Download, AlertCircle, Calendar, DollarSign, TrendingDown } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-[#1F2A44]">My Payslips</h1>
        <p className="text-sm text-[#6B7385]">View and download your monthly salary statements</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
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
            description="Your payslips will appear here once official monthly payroll runs are finalized by Admin."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {payslips.map(({ runId, month, finalizedAt, payslip }) => (
            <Card key={runId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#12A087]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#1F2A44]">{month}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Finalized
                  </span>
                </div>
                <p className="text-xs text-[#6B7385]">
                  Basic: PKR {payslip.basicSalary?.toLocaleString()} • Gross: PKR {payslip.grossSalary?.toLocaleString()} • Working Days: {payslip.workingDaysInMonth}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#6B7385] pt-1">
                  <span>Deductions: <strong className="text-red-600">-PKR {payslip.deductionAmount?.toLocaleString() || '0'}</strong></span>
                  <span>Tax: <strong className="text-[#6B7385]">PKR {payslip.monthlyTax?.toLocaleString() || '0'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#E3E7EE]">
                <div className="text-left md:text-right">
                  <span className="text-[11px] uppercase font-bold text-[#6B7385] block">Net Take-Home Pay</span>
                  <span className="text-2xl font-extrabold text-[#12A087]">
                    PKR {payslip.netSalary?.toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={() => handleDownload(runId, payslip.employeeId, month)}
                  className="flex items-center gap-2 bg-[#1F2A44] hover:bg-[#151D30] text-white"
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
