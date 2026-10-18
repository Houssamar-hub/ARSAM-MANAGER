
import mongoose from "mongoose";
import Equipment from "../models/Equipment.js";
import Chantier from "../models/Chantier.js";

const CATEGORIES = ["machinery", "vehicle", "tool", "safety", "other"];
const CONDITIONS = ["new", "good", "damaged", "maintenance"];
const STATUSES = ["available", "assigned", "unavailable"];

const parseNonNegativeNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (typeof value !== "number" && typeof value !== "string")
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
};

const isValidDate = (value) =>
  (typeof value === "string" || value instanceof Date) &&
  value !== "" &&
  !Number.isNaN(new Date(value).getTime());

const populateEquipment = (query) =>
  query
    .populate("chantier", "name location status")
    .populate("createdBy", "name email");

const handleError = (res, error, operation) => {
  console.error(`${operation} failed:`, error.message);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Equipment reference already exists",
    });
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid equipment data",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server error",
  });
};

const validateChantier = async (chantierId) => {
  if (!mongoose.isValidObjectId(chantierId)) {
    return "Invalid chantier ID";
  }

  const chantier = await Chantier.findById(chantierId).select("_id");

  return chantier ? null : "Chantier not found";
};

// Create equipment
export const createEquipment = async (req, res) => {
  try {
    const {
      name,
      reference,
      category,
      description,
      quantity,
      condition,
      status,
      chantier,
      purchaseDate,
      purchasePrice,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof reference !== "string" ||
      !reference.trim() ||
      typeof category !== "string" ||
      quantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, reference, category and quantity are required",
      });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment category",
      });
    }

    if (condition !== undefined && !CONDITIONS.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment condition",
      });
    }

    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment status",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
    }

    const parsedQuantity = parseNonNegativeNumber(quantity);

    if (
      parsedQuantity === null ||
      !Number.isInteger(parsedQuantity)
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer",
      });
    }

    const parsedPurchasePrice =
      purchasePrice === undefined
        ? 0
        : parseNonNegativeNumber(purchasePrice);

    if (parsedPurchasePrice === null) {
      return res.status(400).json({
        success: false,
        message: "Purchase price must be a non-negative number",
      });
    }

    if (
      purchaseDate !== undefined &&
      purchaseDate !== null &&
      purchaseDate !== "" &&
      !isValidDate(purchaseDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase date",
      });
    }

    if (chantier !== undefined && chantier !== null && chantier !== "") {
      const chantierError = await validateChantier(chantier);

      if (chantierError) {
        const statusCode = chantierError === "Chantier not found" ? 404 : 400;

        return res.status(statusCode).json({
          success: false,
          message: chantierError,
        });
      }
    }

    const normalizedReference = reference.trim().toUpperCase();

    const existingEquipment = await Equipment.findOne({
      reference: normalizedReference,
    }).select("_id");

    if (existingEquipment) {
      return res.status(409).json({
        success: false,
        message: "Equipment reference already exists",
      });
    }

    const equipment = await Equipment.create({
      name: name.trim(),
      reference: normalizedReference,
      category,
      description: description?.trim() ?? "",
      quantity: parsedQuantity,
      condition,
      status,
      chantier: chantier || null,
      purchaseDate:
        purchaseDate === undefined || purchaseDate === null || purchaseDate === ""
          ? null
          : new Date(purchaseDate),
      purchasePrice: parsedPurchasePrice,
      createdBy: req.user.id,
    });

    const result = await populateEquipment(
      Equipment.findById(equipment._id)
    );

    return res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      equipment: result,
    });
  } catch (error) {
    return handleError(res, error, "Create equipment");
  }
};

// Get all equipment
export const getEquipments = async (req, res) => {
  try {
    const { search, category, condition, status, chantier } = req.query;
    const filter = {};

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid equipment category",
        });
      }

      filter.category = category;
    }

    if (condition) {
      if (!CONDITIONS.includes(condition)) {
        return res.status(400).json({
          success: false,
          message: "Invalid equipment condition",
        });
      }

      filter.condition = condition;
    }

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid equipment status",
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

    const equipments = await populateEquipment(
      Equipment.find(filter).sort({ createdAt: -1 })
    );

    const term =
      typeof search === "string" ? search.trim().toLowerCase() : "";

    const results = term
      ? equipments.filter((item) =>
          item.name.toLowerCase().includes(term) ||
          item.reference.toLowerCase().includes(term)
        )
      : equipments;

    return res.status(200).json({
      success: true,
      count: results.length,
      equipments: results,
    });
  } catch (error) {
    return handleError(res, error, "Get equipments");
  }
};

// Get equipment by ID
export const getEquipmentById = async (req, res) => {
  try {
    const equipment = await populateEquipment(
      Equipment.findById(req.params.id)
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      equipment,
    });
  } catch (error) {
    return handleError(res, error, "Get equipment");
  }
};

// Update equipment
export const updateEquipment = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "reference",
      "category",
      "description",
      "quantity",
      "condition",
      "status",
      "chantier",
      "purchaseDate",
      "purchasePrice",
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

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.reference !== undefined) {
      if (
        typeof updates.reference !== "string" ||
        !updates.reference.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Reference must be a non-empty string",
        });
      }

      updates.reference = updates.reference.trim().toUpperCase();
    }

    if (updates.category !== undefined && !CATEGORIES.includes(updates.category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment category",
      });
    }

    if (
      updates.condition !== undefined &&
      !CONDITIONS.includes(updates.condition)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment condition",
      });
    }

    if (updates.status !== undefined && !STATUSES.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment status",
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

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.quantity !== undefined) {
      const parsedQuantity = parseNonNegativeNumber(updates.quantity);

      if (
        parsedQuantity === null ||
        !Number.isInteger(parsedQuantity)
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a non-negative integer",
        });
      }

      updates.quantity = parsedQuantity;
    }

    if (updates.purchasePrice !== undefined) {
      const parsedPurchasePrice = parseNonNegativeNumber(
        updates.purchasePrice
      );

      if (parsedPurchasePrice === null) {
        return res.status(400).json({
          success: false,
          message: "Purchase price must be a non-negative number",
        });
      }

      updates.purchasePrice = parsedPurchasePrice;
    }

    if (updates.purchaseDate === "") {
      updates.purchaseDate = null;
    } else if (updates.purchaseDate !== undefined && updates.purchaseDate !== null) {
      if (!isValidDate(updates.purchaseDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid purchase date",
        });
      }

      updates.purchaseDate = new Date(updates.purchaseDate);
    }

    if (updates.chantier) {
      const chantierError = await validateChantier(updates.chantier);

      if (chantierError) {
        const statusCode = chantierError === "Chantier not found" ? 404 : 400;

        return res.status(statusCode).json({
          success: false,
          message: chantierError,
        });
      }
    } else if (
      updates.chantier === "" ||
      updates.chantier === null
    ) {
      updates.chantier = null;
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    await equipment.populate([
      { path: "chantier", select: "name location status" },
      { path: "createdBy", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      equipment,
    });
  } catch (error) {
    return handleError(res, error, "Update equipment");
  }
};

// Delete equipment
export const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    return handleError(res, error, "Delete equipment");
  }
};
