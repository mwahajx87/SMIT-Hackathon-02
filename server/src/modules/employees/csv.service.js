import { Department, Designation } from '../org/org.models.js';
import { Employee } from './employee.model.js';
import { createEmployee } from './employee.service.js';

/**
 * Validates CSV employee rows.
 * Required: name, email, department, designation, joinDate, basicSalary.
 * Checks: email format, positive salary, ISO date, known department and designation.
 */
export async function processCsvImport(rows, isDryRun, ctx) {
  const errors = [];
  const validRows = [];

  const [departments, designations] = await Promise.all([
    Department.find(),
    Designation.find()
  ]);

  const deptMap = new Map();
  departments.forEach((d) => {
    deptMap.set(d.name.toLowerCase(), d._id);
    deptMap.set(d.code.toLowerCase(), d._id);
  });

  const desigMap = new Map();
  designations.forEach((des) => {
    desigMap.set(des.title.toLowerCase(), des._id);
  });

  const seenEmails = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Check required fields
    if (!row.name || !row.name.trim()) {
      errors.push({ row: rowNum, field: 'name', reason: 'Name is required' });
    }

    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
      errors.push({ row: rowNum, field: 'email', reason: 'Valid email address is required' });
    } else {
      const emailLower = row.email.trim().toLowerCase();
      if (seenEmails.has(emailLower)) {
        errors.push({ row: rowNum, field: 'email', reason: 'Duplicate email in CSV import' });
      }
      seenEmails.add(emailLower);
    }

    // Check department
    const deptKey = (row.department || '').trim().toLowerCase();
    const deptId = deptMap.get(deptKey);
    if (!deptId) {
      errors.push({ row: rowNum, field: 'department', reason: `Unknown department '${row.department}'` });
    }

    // Check designation
    const desigKey = (row.designation || '').trim().toLowerCase();
    const desigId = desigMap.get(desigKey);
    if (!desigId) {
      errors.push({ row: rowNum, field: 'designation', reason: `Unknown designation '${row.designation}'` });
    }

    // Check join date
    if (!row.joinDate || !/^\d{4}-\d{2}-\d{2}$/.test(row.joinDate.trim())) {
      errors.push({ row: rowNum, field: 'joinDate', reason: 'Join date must be YYYY-MM-DD' });
    }

    // Check basic salary
    const salary = Number(row.basicSalary);
    if (isNaN(salary) || salary <= 0) {
      errors.push({ row: rowNum, field: 'basicSalary', reason: 'Basic salary must be greater than 0' });
    }

    if (errors.filter((e) => e.row === rowNum).length === 0) {
      validRows.push({
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone || '',
        address: row.address || '',
        gender: ['male', 'female'].includes(row.gender?.toLowerCase()) ? row.gender.toLowerCase() : 'other',
        departmentId: deptId,
        designationId: desigId,
        joinDate: row.joinDate.trim(),
        basicSalary: salary,
        status: 'active'
      });
    }
  }

  // If dry run, simply report counts and errors
  if (isDryRun || errors.length > 0) {
    return {
      dryRun: true,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      canCommit: errors.length === 0
    };
  }

  // Otherwise, commit valid rows
  const createdEmployees = [];
  for (const empData of validRows) {
    const res = await createEmployee(empData, ctx);
    createdEmployees.push({
      code: res.employee.code,
      name: res.employee.name,
      email: res.employee.email,
      tempPassword: res.tempPassword
    });
  }

  return {
    dryRun: false,
    importedCount: createdEmployees.length,
    employees: createdEmployees
  };
}

export async function exportEmployeesCsv() {
  const employees = await Employee.find()
    .populate('departmentId', 'name code')
    .populate('designationId', 'title');

  const headers = ['Code', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Join Date', 'Status', 'Basic Salary'];
  const rows = employees.map((emp) => [
    emp.code,
    `"${emp.name.replace(/"/g, '""')}"`,
    emp.email,
    emp.phone || '',
    emp.departmentId?.name || '',
    emp.designationId?.title || '',
    emp.joinDate,
    emp.status,
    emp.basicSalary
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
