import Payslip from '../models/Payslip.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

export const getMyPayslips = async (req, res, next) => {
  try {
    const list = await Payslip.find({ employee: req.user._id })
      .sort({ year: -1, month: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getEmployeePayslips = async (req, res, next) => {
  try {
    const { id } = req.params; // employee ID
    const list = await Payslip.find({ employee: id })
      .sort({ year: -1, month: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createPayslip = async (req, res, next) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

    if (!employeeId || !month || !year || basicSalary === undefined) {
      return res.status(400).json({ message: 'Employee, month, year, and basic salary are required' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee user not found' });
    }

    const exists = await Payslip.findOne({ employee: employeeId, month, year });
    if (exists) {
      return res.status(400).json({ message: 'A payslip has already been generated for this employee for that period' });
    }

    const basic = Number(basicSalary);
    const allow = Number(allowances || 0);
    const deduct = Number(deductions || 0);
    const net = basic + allow - deduct;

    const payslip = await Payslip.create({
      employee: employeeId,
      month,
      year,
      basicSalary: basic,
      allowances: allow,
      deductions: deduct,
      netSalary: net,
      status: 'Paid'
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'PAYSLIP_CREATE',
      details: `Generated payslip for ${employee.name} for ${month}/${year}. Net: ${net}`,
      ipAddress: req.ip
    });

    // Create in-app notification for the employee
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1] || `Month ${month}`;

    await Notification.create({
      recipient: employeeId,
      message: `Your payslip for ${monthName} ${year} has been generated. Net Salary: $${net}`,
      type: 'info'
    });

    res.status(201).json(payslip);
  } catch (error) {
    next(error);
  }
};

export const deletePayslip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findById(id).populate('employee', 'name');
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    await payslip.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'PAYSLIP_DELETE',
      details: `Deleted payslip ID ${id} for employee ${payslip.employee?.name || 'Unknown'}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    next(error);
  }
};
