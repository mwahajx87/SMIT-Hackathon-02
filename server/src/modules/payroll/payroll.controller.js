import * as payrollService from './payroll.service.js';

export async function createPayrollRun(req, res, next) {
  try {
    const result = await payrollService.createPayrollRun(req.body.month, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function regeneratePayrollRun(req, res, next) {
  try {
    const result = await payrollService.regeneratePayrollRun(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function finalizePayrollRun(req, res, next) {
  try {
    const result = await payrollService.finalizePayrollRun(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listPayrollRuns(req, res, next) {
  try {
    const result = await payrollService.listPayrollRuns(req.query);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPayrollRunById(req, res, next) {
  try {
    const result = await payrollService.getPayrollRunById(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeePayslips(req, res, next) {
  try {
    const result = await payrollService.getEmployeePayslips(req.query.employeeId, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function downloadPayslipPdf(req, res, next) {
  try {
    const { runId, employeeId } = req.params;
    const { run, payslip } = await payrollService.getSinglePayslip(runId, employeeId, req.ctx);

    // Lazy-load pdfkit only when actually generating a PDF (avoids cold-start crash on Vercel)
    const { generatePayslipPdf } = await import('./pdf.service.js');
    const pdfBuffer = await generatePayslipPdf({ run, item: payslip });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip-${payslip.employeeCode}-${run.month}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
