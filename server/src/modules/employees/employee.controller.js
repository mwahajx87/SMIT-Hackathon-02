import * as employeeService from './employee.service.js';
import * as csvService from './csv.service.js';

export async function createEmployee(req, res, next) {
  try {
    const result = await employeeService.createEmployee(req.body, req.ctx);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listEmployees(req, res, next) {
  try {
    const result = await employeeService.listEmployees(req.query, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeById(req, res, next) {
  try {
    const result = await employeeService.getEmployeeById(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const result = await employeeService.updateEmployee(req.params.id, req.body, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const result = await employeeService.updateMyProfile(req.body, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getSalary(req, res, next) {
  try {
    const result = await employeeService.getEmployeeSalary(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateSalary(req, res, next) {
  try {
    const result = await employeeService.updateEmployeeSalary(req.params.id, req.body, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function importCsv(req, res, next) {
  try {
    const isDryRun = req.query.dryRun !== 'false';
    const rows = req.body.rows || [];
    const result = await csvService.processCsvImport(rows, isDryRun, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const csvData = await csvService.exportEmployeesCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.send(csvData);
  } catch (err) {
    next(err);
  }
}
