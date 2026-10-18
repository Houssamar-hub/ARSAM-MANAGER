
import mongoose from "mongoose";
import Chantier from "../models/Chantier.js";
import User from "../models/User.js";

const validStatuses = [
  "planned",
  "in_progress",
  "completed",
  "suspended",
];

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateManager = async (managerId) => {
  if (!mongoose.isValidObjectId(managerId)) {
    return false;
  }

  const manager = await User.findOne({
    _id: managerId,
    role: "manager",
    status: "active",
  }).select("_id");

  return Boolean(manager);
};

// Create chantier
export const createChantier = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      budget,
      startDate,
      endDate,
      status,
      manager,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      budget === undefined ||
      budget === "" ||
      startDate === undefined ||
      endDate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, location, budget, start date and end date",
      });
    }

    if (
      (description !== undefined &&
        typeof description !== "string") ||
      (status !== undefined &&
        !validStatuses.includes(status))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid description or chantier status",
      });
    }

    const numericBudget = Number(budget);

    if (
      !Number.isFinite(numericBudget) ||
      numericBudget < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Budget must be a non-negative number",
      });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid chantier dates",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after or equal to start date",
      });
    }

    let managerId;

    if (manager !== undefined && manager !== null && manager !== "") {
      if (!(await validateManager(manager))) {
        return res.status(400).json({
          success: false,
          message: "Manager must be an existing active manager",
        });
      }

      managerId = manager;
    } else if (req.user.role === "manager") {
      managerId = req.user.id;
    }

    const chantierData = {
      name: name.trim(),
      description,
      location: location.trim(),
      budget: numericBudget,
      startDate: start,
      endDate: end,
      createdBy: req.user.id,
    };

    if (status !== undefined) {
      chantierData.status = status;
    }

    if (managerId) {
      chantierData.manager = managerId;
    }

    const chantier = await Chantier.create(chantierData);

    const populatedChantier = await Chantier.findById(chantier._id)
      .populate("manager", "name email role")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Chantier created successfully",
      chantier: populatedChantier,
    });
  } catch (error) {
    console.error("Create chantier:", error.message);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all chantiers
export const getChantiers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chantier status",
        });
      }

      filter.status = status;
    }

    if (search !== undefined) {
      if (typeof search !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search must be a string",
        });
      }

      const searchTerm = search.trim();

      if (searchTerm) {
        const safeSearch = escapeRegex(searchTerm);

        filter.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { location: { $regex: safeSearch, $options: "i" } },
        ];
      }
    }

    const chantiers = await Chantier.find(filter)
      .populate("manager", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: chantiers.length,
      chantiers,
    });
  } catch (error) {
    console.error("Get chantiers:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get chantier by ID
export const getChantierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier ID",
      });
    }

    const chantier = await Chantier.findById(id)
      .populate("manager", "name email role")
      .populate("createdBy", "name email");

    if (!chantier) {
      return res.status(404).json({
        success: false,
        message: "Chantier not found",
      });
    }

    return res.status(200).json({
      success: true,
      chantier,
    });
  } catch (error) {
    console.error("Get chantier:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update chantier
export const updateChantier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier ID",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "location",
      "budget",
      "startDate",
      "endDate",
      "status",
      "manager",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" ||
        !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Chantier name must be a non-empty string",
      });
    }

    if (
      updates.location !== undefined &&
      (typeof updates.location !== "string" ||
        !updates.location.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Chantier location must be a non-empty string",
      });
    }

    if (
      updates.description !== undefined &&
      typeof updates.description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
    }

    if (
      updates.status !== undefined &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier status",
      });
    }

    if (updates.budget !== undefined) {
      if (
        updates.budget === "" ||
        !Number.isFinite(Number(updates.budget)) ||
        Number(updates.budget) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Budget must be a non-negative number",
        });
      }

      updates.budget = Number(updates.budget);
    }

    for (const field of ["startDate", "endDate"]) {
      if (updates[field] !== undefined) {
        if (!isValidDate(updates[field])) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}`,
          });
        }

        updates[field] = new Date(updates[field]);
      }
    }

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
    }

    if (updates.location !== undefined) {
      updates.location = updates.location.trim();
    }

    if (updates.manager !== undefined) {
      if (!(await validateManager(updates.manager))) {
        return res.status(400).json({
          success: false,
          message: "Manager must be an existing active manager",
        });
      }
    }

    const chantier = await Chantier.findById(id);

    if (!chantier) {
      return res.status(404).json({
        success: false,
        message: "Chantier not found",
      });
    }

    const start = updates.startDate ?? chantier.startDate;
    const end = updates.endDate ?? chantier.endDate;

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after or equal to start date",
      });
    }

    Object.assign(chantier, updates);
    await chantier.save();

    const updatedChantier = await Chantier.findById(chantier._id)
      .populate("manager", "name email role")
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Chantier updated successfully",
      chantier: updatedChantier,
    });
  } catch (error) {
    console.error("Update chantier:", error.message);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete chantier
export const deleteChantier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chantier ID",
      });
    }

    const chantier = await Chantier.findByIdAndDelete(id);

    if (!chantier) {
      return res.status(404).json({
        success: false,
        message: "Chantier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chantier deleted successfully",
    });
  } catch (error) {
    console.error("Delete chantier:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
