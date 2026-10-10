
import mongoose from "mongoose";
import Chantier from "../models/Chantier.js";

//create chantier
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
      manager
    } = req.body;

    if (
      !name?.trim() ||
      !location?.trim() ||
      budget === undefined ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    if (
      !Number.isFinite(Number(budget)) ||
      Number(budget) < 0
    ) {
      return res.status(400).json({
        message: "Budget must be a valid positive number"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        message: "Please provide valid chantier dates"
      });
    }

    const chantier = await Chantier.create({
      name,
      description,
      location,
      budget: Number(budget),
      startDate: start,
      endDate: end,
      status,
      manager: manager || req.user.id,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "Chantier created successfully",
      chantier
    });
  } catch (error) {
    console.error("Create chantier:", error.message);

    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

//get all chantiers
export const getChantiers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { location: { $regex: search.trim(), $options: "i" } }
      ];
    }

    const chantiers = await Chantier.find(filter)
      .populate("manager", "name email role")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: chantiers.length,
      chantiers
    });
  } catch (error) {
    console.error("Get chantiers:", error.message);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
//get chantier by id
export const getChantierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid chantier ID"
      });
    }

    const chantier = await Chantier.findById(id)
      .populate("manager", "name email role")
      .populate("createdBy", "name email");

    if (!chantier) {
      return res.status(404).json({
        message: "Chantier not found"
      });
    }

    return res.status(200).json({ chantier });
  } catch (error) {
    console.error("Get chantier:", error.message);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
//update chantier
export const updateChantier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid chantier ID"
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
      "manager"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined &&
        (typeof updates.name !== "string" || !updates.name.trim())) {
      return res.status(400).json({
        message: "Chantier name is required"
      });
    }

    if (updates.location !== undefined &&
        (typeof updates.location !== "string" || !updates.location.trim())) {
      return res.status(400).json({
        message: "Chantier location is required"
      });
    }

    if (updates.budget !== undefined) {
      if (
        updates.budget === "" ||
        !Number.isFinite(Number(updates.budget)) ||
        Number(updates.budget) < 0
      ) {
        return res.status(400).json({
          message: "Invalid budget"
        });
      }

      updates.budget = Number(updates.budget);
    }

    if (updates.startDate !== undefined) {
      updates.startDate = new Date(updates.startDate);
    }

    if (updates.endDate !== undefined) {
      updates.endDate = new Date(updates.endDate);
    }

    if (
      (updates.startDate && Number.isNaN(updates.startDate.getTime())) ||
      (updates.endDate && Number.isNaN(updates.endDate.getTime()))
    ) {
      return res.status(400).json({
        message: "Invalid chantier dates"
      });
    }

    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
    }

    if (updates.location !== undefined) {
      updates.location = updates.location.trim();
    }

    const chantier = await Chantier.findById(id);

    if (!chantier) {
      return res.status(404).json({
        message: "Chantier not found"
      });
    }

    const start = updates.startDate ?? chantier.startDate;
    const end = updates.endDate ?? chantier.endDate;

    if (end < start) {
      return res.status(400).json({
        message: "End date must be after or equal to start date"
      });
    }

    Object.assign(chantier, updates);
    await chantier.save();

    return res.status(200).json({
      message: "Chantier updated successfully",
      chantier
    });
  } catch (error) {
    console.error("Update chantier:", error.message);

    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};
//delete chantier
export const deleteChantier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid chantier ID"
      });
    }

    const chantier = await Chantier.findByIdAndDelete(id);

    if (!chantier) {
      return res.status(404).json({
        message: "Chantier not found"
      });
    }

    return res.status(200).json({
      message: "Chantier deleted successfully"
    });
  } catch (error) {
    console.error("Delete chantier:", error.message);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
