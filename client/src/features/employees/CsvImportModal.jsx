import React, { useState } from 'react';
import { apiRequest } from '../../lib/api.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';

export function CsvImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setDryRunResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        rows.push(row);
      }
      setParsedRows(rows);
    };
    reader.readAsText(selected);
  };

  const handleDryRun = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    try {
      const res = await apiRequest('/employees/import?dryRun=true', {
        method: 'POST',
        body: JSON.stringify({ rows: parsedRows })
      });
      setDryRunResult(res);
    } catch (err) {
      alert(err.message || 'Dry run failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    setCommitting(true);
    try {
      await apiRequest('/employees/import?dryRun=false', {
        method: 'POST',
        body: JSON.stringify({ rows: parsedRows })
      });
      alert('Employees imported successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || 'Import failed.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import employees via CSV" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-[var(--text-muted)]">
          Upload a CSV file containing: <code className="bg-[var(--surface-muted)] px-1.5 py-0.5 rounded text-[var(--text)] border border-[var(--border)]">name, email, department, designation, joinDate, basicSalary, phone, address, gender</code>.
        </p>

        {/* Upload area */}
        <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center hover:border-[var(--primary)] transition-colors bg-[var(--surface)]">
          <input
            type="file"
            accept=".csv"
            id="csvUpload"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-8 h-8 text-[var(--primary)] mb-2" />
            <span className="text-sm font-medium text-[var(--text)]">
              {file ? file.name : 'Choose a CSV file to upload'}
            </span>
            <span className="text-xs text-[var(--text-muted)] mt-1">
              {parsedRows.length > 0 ? `${parsedRows.length} rows detected` : 'Click to browse'}
            </span>
          </label>
        </div>

        {/* Dry run button */}
        {parsedRows.length > 0 && !dryRunResult && (
          <div className="flex justify-end">
            <Button onClick={handleDryRun} loading={loading}>
              Run validation
            </Button>
          </div>
        )}

        {/* Dry run results */}
        {dryRunResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border text-xs">
              {dryRunResult.canCommit ? (
                <>
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                  <span className="font-medium text-[var(--success)]">
                    Validation passed! All {dryRunResult.validCount} rows are ready to import.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                  <span className="font-medium text-[var(--danger)]">
                    {dryRunResult.errorCount} validation issues found. Please review the errors below before committing.
                  </span>
                </>
              )}
            </div>

            {/* Error table */}
            {dryRunResult.errors?.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-lg">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] font-medium sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {dryRunResult.errors.map((err, idx) => (
                      <tr key={idx} className="text-rose-600 dark:text-rose-400 bg-red-50/20">
                        <td className="px-3 py-1.5 font-mono tabular-nums">{err.row}</td>
                        <td className="px-3 py-1.5 font-medium">{err.field}</td>
                        <td className="px-3 py-1.5">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button variant="secondary" onClick={() => setDryRunResult(null)}>
                Re-upload file
              </Button>
              {dryRunResult.canCommit && (
                <Button onClick={handleCommitImport} loading={committing}>
                  Confirm import ({dryRunResult.validCount} employees)
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
