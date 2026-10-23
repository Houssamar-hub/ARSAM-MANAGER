import mongoose from "mongoose";
import Material from "../models/Material.js";
import Chantier from "../models/Chantier.js";

const categories = [
  "cement",
  "iron",
  "sand",
  "gravel",
  "wood",
  "paint",
  "electrical",
  "plumbing",
  "other",
];

const units = ["piece", "kg", "ton", "bag", "m3", "liter", "meter"];

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateMaterial = (query) =>
  query
    .populate("chantier", "name location status")
    .populate("createdBy", "name email");

// Create material
export const createMaterial = async (req, res) => {
  try {
    const {
      name,
      reference,
      category,
      unit,
      quantity,
      minStock,
      unitPrice,
      storageLocation,
      chantier,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof reference !== "string" ||
      !reference.trim() ||
      !category ||
      !unit
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, reference, category and unit are required",
      });
    }

    if (!categories.includes(category) || !units.includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category or unit",
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 150 characters",
      });
    }

    const normalizedReference = reference.trim().toUpperCase();
    if (normalizedReference.length < 2 || normalizedReference.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Reference must be between 2 and 50 characters",
      });
    }

    if (
      quantity !== undefined &&
      (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative number",
      });
    }

    if (
      minStock !== undefined &&
      (!Number.isFinite(Number(minStock)) || Number(minStock) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock must be a non-negative number",
      });
    }

    if (
      unitPrice !== undefined &&
      (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Unit price must be a non-negative number",
      });
    }

    let chantierId = null;
    if (chantier && chantier !== "") {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chantier ID",
        });
      }

      const exists = await Chantier.findById(chantier);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Chantier not found",
        });
      }
      chantierId = chantier;
    }

    const existing = await Material.findOne({
      reference: normalizedReference,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A material with this reference already exists",
      });
    }

    const material = await Material.create({
      name: trimmedName,
      reference: normalizedReference,
      category,
      unit,
      quantity: quantity !== undefined ? Number(quantity) : 0,
      minStock: minStock !== undefined ? Number(minStock) : 0,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : 0,
      storageLocation: typeof storageLocation === "string" ? storageLocation.trim() : "",
      chantier: chantierId,
      createdBy: req.user.id,
    });

    const populatedMaterial = await populateMaterial(
      Material.findById(material._id)
    );

    return res.status(201).json({
      success: true,
      message: "Material created successfully",
      material: populatedMaterial,
    });
  } catch (error) {
    console.error("Create material failed:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A material with this reference already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid material data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all materials
export const getMaterials = async (req, res) => {
  try {
    const { search, category, chantier, lowStock } = req.query;
    const filter = {};

    if (category) {
      if (!categories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
      filter.category = category;
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

    if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$minStock"] };
    }

    if (search !== undefined && typeof search === "string" && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { reference: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const materials = await populateMaterial(
      Material.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    console.error("Get materials failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get material by ID
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
    }

    const material = await populateMaterial(Material.findById(id));

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    return res.status(200).json({
      success: true,
      material,
    });
  } catch (error) {
    console.error("Get material failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update material
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
    }

    const allowed = [
      "name",
      "reference",
      "category",
      "unit",
      "quantity",
      "minStock",
      "unitPrice",
      "storageLocation",
      "chantier",
    ];

    const updates = {};
    for (const field of allowed) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
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
      if (typeof updates.reference !== "string" || !updates.reference.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reference must be a non-empty string",
        });
      }
      updates.reference = updates.reference.trim().toUpperCase();

      const existing = await Material.findOne({
        reference: updates.reference,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A material with this reference already exists",
        });
      }
    }

    if (updates.category !== undefined && !categories.includes(updates.category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (updates.unit !== undefined && !units.includes(updates.unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit",
      });
    }

    if (updates.quantity !== undefined) {
      const num = Number(updates.quantity);
      if (!Number.isFinite(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a non-negative number",
        });
      }
      updates.quantity = num;
    }

    if (updates.minStock !== undefined) {
      const num = Number(updates.minStock);
      if (!Number.isFinite(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum stock must be a non-negative number",
        });
      }
      updates.minStock = num;
    }

    if (updates.unitPrice !== undefined) {
      const num = Number(updates.unitPrice);
      if (!Number.isFinite(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: "Unit price must be a non-negative number",
        });
      }
      updates.unitPrice = num;
    }

    if (updates.storageLocation !== undefined) {
      updates.storageLocation =
        typeof updates.storageLocation === "string"
          ? updates.storageLocation.trim()
          : "";
    }

    if (updates.chantier !== undefined) {
      if (updates.chantier === "" || updates.chantier === null) {
        updates.chantier = null;
      } else {
        if (!mongoose.isValidObjectId(updates.chantier)) {
          return res.status(400).json({
            success: false,
            message: "Invalid chantier ID",
          });
        }
        const exists = await Chantier.findById(updates.chantier);
        if (!exists) {
          return res.status(404).json({
            success: false,
            message: "Chantier not found",
          });
        }
      }
    }

    const material = await Material.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const populatedMaterial = await populateMaterial(
      Material.findById(material._id)
    );

    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      material: populatedMaterial,
    });
  } catch (error) {
    console.error("Update material failed:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A material with this reference already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid material data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete material
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
    }

    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    await material.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Delete material failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
