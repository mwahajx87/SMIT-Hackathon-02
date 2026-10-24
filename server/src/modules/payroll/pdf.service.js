import PDFDocument from 'pdfkit';

/**
 * Generate a clean, professional PDF payslip.
 * Returns a Promise that resolves with a Buffer.
 */
export function generatePayslipPdf({ run, item }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Banner
      doc.rect(0, 0, doc.page.width, 80).fill('#1F2A44');
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('HCM Lite', 40, 25);
      doc.fontSize(11).font('Helvetica').text('CONFIDENTIAL SALARY PAYSLIP', 40, 52);

      doc.fillColor('#12A087').fontSize(14).font('Helvetica-Bold')
        .text(`PAY PERIOD: ${run.month}`, doc.page.width - 240, 35, { align: 'right' });

      doc.moveDown(4);

      // Employee Information Box
      const topY = 100;
      doc.roundedRect(40, topY, doc.page.width - 80, 80, 6).stroke('#E3E7EE');

      doc.fillColor('#1F2A44').fontSize(10).font('Helvetica-Bold');
      doc.text('Employee Name:', 55, topY + 15);
      doc.text('Employee Code:', 55, topY + 35);
      doc.text('Department:', 55, topY + 55);

      doc.font('Helvetica').fillColor('#334155');
      doc.text(item.employeeName, 160, topY + 15);
      doc.text(item.employeeCode, 160, topY + 35);
      doc.text(item.departmentName, 160, topY + 55);

      doc.fillColor('#1F2A44').font('Helvetica-Bold');
      doc.text('Designation:', 320, topY + 15);
      doc.text('Working Days:', 320, topY + 35);
      doc.text('Daily Rate:', 320, topY + 55);

      doc.font('Helvetica').fillColor('#334155');
      doc.text(item.designationTitle, 410, topY + 15);
      doc.text(`${item.workingDaysInMonth} days`, 410, topY + 35);
      doc.text(`PKR ${item.perDayRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 410, topY + 55);

      // Earnings & Deductions Tables side-by-side
      const tableY = 200;
      const colWidth = (doc.page.width - 100) / 2;

      // Earnings Table Header
      doc.rect(40, tableY, colWidth, 24).fill('#F8FAFC');
      doc.fillColor('#1F2A44').fontSize(11).font('Helvetica-Bold').text('EARNINGS', 50, tableY + 6);
      doc.text('AMOUNT (PKR)', 40 + colWidth - 110, tableY + 6, { align: 'right' });

      // Earnings Rows
      let currY = tableY + 30;
      const earnings = [
        ['Basic Salary', item.basicSalary],
        ['House Rent Allowance (HRA 40%)', item.hra],
        ['Medical Allowance (10%)', item.medical]
      ];

      earnings.forEach(([label, amount]) => {
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(label, 50, currY);
        doc.font('Helvetica-Bold').text(
          amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          40 + colWidth - 110,
          currY,
          { align: 'right' }
        );
        currY += 20;
      });

      // Total Gross Row
      doc.rect(40, currY, colWidth, 22).fill('#F1F5F9');
      doc.fillColor('#1F2A44').fontSize(9).font('Helvetica-Bold').text('Gross Earnings', 50, currY + 6);
      doc.text(
        item.grossSalary.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        40 + colWidth - 110,
        currY + 6,
        { align: 'right' }
      );

      // Deductions Table Header
      const dedX = 60 + colWidth;
      doc.rect(dedX, tableY, colWidth, 24).fill('#F8FAFC');
      doc.fillColor('#1F2A44').fontSize(11).font('Helvetica-Bold').text('DEDUCTIONS', dedX + 10, tableY + 6);
      doc.text('AMOUNT (PKR)', dedX + colWidth - 100, tableY + 6, { align: 'right' });

      // Deductions Rows
      let dedY = tableY + 30;
      const deductions = [
        [`Absences (${item.absentDays}d) & Half-Days (${item.halfDays})`, item.deductionAmount],
        ['Income Tax (Monthly Slab)', item.monthlyTax],
        [`Unpaid Leaves (${item.unpaidLeaveDays}d)`, 0]
      ];

      deductions.forEach(([label, amount]) => {
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(label, dedX + 10, dedY);
        doc.font('Helvetica-Bold').text(
          amount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          dedX + colWidth - 100,
          dedY,
          { align: 'right' }
        );
        dedY += 20;
      });

      // Total Deductions Row
      const totalDedAmount = item.deductionAmount + item.monthlyTax;
      doc.rect(dedX, dedY, colWidth, 22).fill('#F1F5F9');
      doc.fillColor('#1F2A44').fontSize(9).font('Helvetica-Bold').text('Total Deductions', dedX + 10, dedY + 6);
      doc.text(
        totalDedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        dedX + colWidth - 100,
        dedY + 6,
        { align: 'right' }
      );

      // Net Pay Highlight Box
      const netY = Math.max(currY, dedY) + 40;
      doc.rect(40, netY, doc.page.width - 80, 50).fill('#12A087');
      doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold').text('NET TAKE-HOME PAY', 60, netY + 18);
      doc.fontSize(16).text(
        `PKR ${item.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        doc.page.width - 240,
        netY + 16,
        { align: 'right' }
      );

      // Footer note
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('This is a computer-generated payslip and does not require a physical signature.', 40, doc.page.height - 40, {
          align: 'center',
          width: doc.page.width - 80
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
