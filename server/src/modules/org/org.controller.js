import * as orgService from './org.service.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await orgService.getSettings();
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await orgService.updateSettings(req.body, req.ctx);
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

// Departments
export async function getDepartments(req, res, next) {
  try {
    const list = await orgService.getDepartments();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const item = await orgService.createDepartment(req.body, req.ctx);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const result = await orgService.deleteDepartment(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Designations
export async function getDesignations(req, res, next) {
  try {
    const list = await orgService.getDesignations();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
}

export async function createDesignation(req, res, next) {
  try {
    const item = await orgService.createDesignation(req.body, req.ctx);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteDesignation(req, res, next) {
  try {
    const result = await orgService.deleteDesignation(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// Leave Types
export async function getLeaveTypes(req, res, next) {
  try {
    const list = await orgService.getLeaveTypes();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
}

export async function createLeaveType(req, res, next) {
  try {
    const item = await orgService.createLeaveType(req.body, req.ctx);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

// Holidays
export async function getHolidays(req, res, next) {
  try {
    const list = await orgService.getHolidays();
    res.json({ data: list });
  } catch (err) {
    next(err);
  }
}

export async function createHoliday(req, res, next) {
  try {
    const item = await orgService.createHoliday(req.body, req.ctx);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteHoliday(req, res, next) {
  try {
    const result = await orgService.deleteHoliday(req.params.id, req.ctx);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
