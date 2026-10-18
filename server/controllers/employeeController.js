
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Chantier from "../models/Chantier.js";

const EMPLOYEE_STATUSES = ["active", "inactive", "on_leave"];

const isValidDate = (value) => {
  if (
    !(typeof value === "string" || value instanceof Date) ||
    value === ""
  ) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

const parseSalary = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (typeof value !== "number" && typeof value !== "string")
  ) {
    return null;
  }

  const salary = Number(value);

  return Number.isFinite(salary) && salary >= 0 ? salary : null;
};

const handleError = (res, error, operation) => {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data provided",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This employee profile already exists",
    });
  }

  console.error(`${operation} failed:`, error.message);

  return res.status(500).json({
    success: false,
    message: "Server error",
  });
};

const populateEmployee = (query) =>
  query
    .populate("user", "name email role status")
    .populate("chantier", "name location status");

export const createEmployee = async (req, res) => {
  try {
    const { user, phone, jobTitle, salary, hireDate, chantier } =
      req.body || {};

    if (
      typeof user !== "string" ||
      !mongoose.isValidObjectId(user) ||
      typeof jobTitle !== "string" ||
      !jobTitle.trim() ||
      salary === undefined ||
      !isValidDate(hireDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid user, job title, salary and hire date are required",
      });
    }

    const parsedSalary = parseSalary(salary);

    if (parsedSalary === null) {
      return res.status(400).json({
        success: false,
        message: "Salary must be a valid non-negative number",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a string",
      });
    }

    if (chantier && !mongoose.isValidObjectId(chantier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier ID",
      });
    }

    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingEmployee = await Employee.findOne({ user });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "This user already has an employee profile",
      });
    }

    if (chantier) {
      const existingChantier = await Chantier.findById(chantier);

      if (!existingChantier) {
        return res.status(404).json({
          success: false,
          message: "Chantier not found",
        });
      }
    }

    const employee = await Employee.create({
      user,
      phone: typeof phone === "string" ? phone.trim() : phone,
      jobTitle: jobTitle.trim(),
      salary: parsedSalary,
      hireDate: new Date(hireDate),
      chantier: chantier || null,
    });

    const result = await populateEmployee(
      Employee.findById(employee._id)
    );

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: result,
    });
  } catch (error) {
    return handleError(res, error, "Create employee");
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { status, search, chantier } = req.query;
    const filter = {};

    if (status) {
      if (!EMPLOYEE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee status",
        });
      }

      filter.status = status;
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chantier ID",
        });
      }

      filter.chantier = chantier;
    }

    const employees = await populateEmployee(
      Employee.find(filter).sort({ createdAt: -1 })
    );

    const term =
      typeof search === "string" ? search.trim().toLowerCase() : "";

    const filteredEmployees = term
      ? employees.filter((employee) => {
          const name = employee.user?.name || "";
          const email = employee.user?.email || "";
          const jobTitle = employee.jobTitle || "";

          return (
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            jobTitle.toLowerCase().includes(term)
          );
        })
      : employees;

    return res.status(200).json({
      success: true,
      count: filteredEmployees.length,
      employees: filteredEmployees,
    });
  } catch (error) {
    return handleError(res, error, "Get employees");
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await populateEmployee(Employee.findById(id));

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    return handleError(res, error, "Get employee");
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const allowedFields = [
      "phone",
      "jobTitle",
      "salary",
      "hireDate",
      "chantier",
      "status",
    ];

    const body = req.body || {};
    const updates = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    if (updates.jobTitle !== undefined) {
      if (
        typeof updates.jobTitle !== "string" ||
        !updates.jobTitle.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Job title must be a non-empty string",
        });
      }

      updates.jobTitle = updates.jobTitle.trim();
    }

    if (updates.phone !== undefined && updates.phone !== null) {
      if (typeof updates.phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a string",
        });
      }

      updates.phone = updates.phone.trim();
    }

    if (updates.salary !== undefined) {
      const parsedSalary = parseSalary(updates.salary);

      if (parsedSalary === null) {
        return res.status(400).json({
          success: false,
          message: "Salary must be a valid non-negative number",
        });
      }

      updates.salary = parsedSalary;
    }

    if (updates.hireDate !== undefined) {
      if (!isValidDate(updates.hireDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hire date",
        });
      }

      updates.hireDate = new Date(updates.hireDate);
    }

    if (
      updates.status !== undefined &&
      !EMPLOYEE_STATUSES.includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee status",
      });
    }

    if (updates.chantier) {
      if (!mongoose.isValidObjectId(updates.chantier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chantier ID",
        });
      }

      const existingChantier = await Chantier.findById(
        updates.chantier
      );

      if (!existingChantier) {
        return res.status(404).json({
          success: false,
          message: "Chantier not found",
        });
      }
    } else if (
      updates.chantier === "" ||
      updates.chantier === null
    ) {
      updates.chantier = null;
    }

    const employee = await Employee.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await employee.populate([
      { path: "user", select: "name email role status" },
      { path: "chantier", select: "name location status" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    return handleError(res, error, "Update employee");
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    return handleError(res, error, "Delete employee");
  }
};
