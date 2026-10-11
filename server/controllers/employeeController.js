
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Chantier from "../models/Chantier.js";

export const createEmployee = async (req, res) => {
  try {
    const { user, phone, jobTitle, salary, hireDate, chantier } = req.body;

    if (!user || !jobTitle || salary === undefined || !hireDate) {
      return res.status(400).json({
        message: "User, jobTitle, salary and hireDate are required"
      });
    }

    if (!mongoose.isValidObjectId(user)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!Number.isFinite(salary) || salary < 0) {
      return res.status(400).json({ message: "Salary must be a valid positive number" });
    }

    if (Number.isNaN(Date.parse(hireDate))) {
      return res.status(400).json({ message: "Invalid hire date" });
    }

    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingEmployee = await Employee.findOne({ user });

    if (existingEmployee) {
      return res.status(409).json({
        message: "This user already has an employee profile"
      });
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      const existingChantier = await Chantier.findById(chantier);

      if (!existingChantier) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    }

    const employee = await Employee.create({
      user,
      phone,
      jobTitle,
      salary,
      hireDate,
      chantier: chantier || null
    });

    const result = await Employee.findById(employee._id)
      .populate("user", "name email role status")
      .populate("chantier", "name location status");

    return res.status(201).json({
      message: "Employee created successfully",
      employee: result
    });
  } catch (error) {
    console.error("Create employee failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An employee profile already exists for this user"
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { status, search, chantier } = req.query;
    const filter = {};

    if (status) {
      if (!["active", "inactive", "on_leave"].includes(status)) {
        return res.status(400).json({ message: "Invalid employee status" });
      }

      filter.status = status;
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      filter.chantier = chantier;
    }

    let employees = Employee.find(filter)
      .populate("user", "name email role status")
      .populate("chantier", "name location status")
      .sort({ createdAt: -1 });

    const results = await employees;

    const filteredResults = search
      ? results.filter((employee) => {
          const name = employee.user?.name || "";
          const email = employee.user?.email || "";
          const jobTitle = employee.jobTitle || "";

          const term = search.toLowerCase();

          return (
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            jobTitle.toLowerCase().includes(term)
          );
        })
      : results;

    return res.status(200).json({
      count: filteredResults.length,
      employees: filteredResults
    });
  } catch (error) {
    console.error("Get employees failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findById(req.params.id)
      .populate("user", "name email role status")
      .populate("chantier", "name location status");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({ employee });
  } catch (error) {
    console.error("Get employee failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const allowedFields = [
      "phone",
      "jobTitle",
      "salary",
      "hireDate",
      "chantier",
      "status"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (
      updates.salary !== undefined &&
      (!Number.isFinite(updates.salary) || updates.salary < 0)
    ) {
      return res.status(400).json({ message: "Invalid salary" });
    }

    if (
      updates.hireDate !== undefined &&
      Number.isNaN(Date.parse(updates.hireDate))
    ) {
      return res.status(400).json({ message: "Invalid hire date" });
    }

    if (updates.status !== undefined &&
        !["active", "inactive", "on_leave"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid employee status" });
    }

    if (updates.chantier) {
      if (!mongoose.isValidObjectId(updates.chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      const existingChantier = await Chantier.findById(updates.chantier);

      if (!existingChantier) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    } else if (updates.chantier === "") {
      updates.chantier = null;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("user", "name email role status")
      .populate("chantier", "name location status");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    console.error("Update employee failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Delete employee failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
