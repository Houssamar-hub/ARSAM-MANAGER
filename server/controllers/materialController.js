import mongoose from "mongoose";
import Material from "../models/Material.js";
import Chantier from "../models/Chantier.js";
import StockMovement from "../models/StockMovement.js";

const categories = [
  "cement", "iron", "sand", "gravel", "wood",
  "paint", "electrical", "plumbing", "other"
];
const units = [
  "piece", "kg", "ton", "bag", "m3", "liter", "meter"
];

export const createMaterial = async (req, res) => {
  try {
    const {
      name, reference, category, unit, minStock,
      unitPrice, storageLocation, chantier
    } = req.body;

    if (!name?.trim() || !reference?.trim() || !category || !unit) {
      return res.status(400).json({
        message: "Name, reference, category and unit are required"
      });
    }

    if (!categories.includes(category) || !units.includes(unit)) {
      return res.status(400).json({
        message: "Invalid category or unit"
      });
    }

    if (
      minStock !== undefined &&
      (!Number.isFinite(minStock) || minStock < 0)
    ) {
      return res.status(400).json({ message: "Invalid minimum stock" });
    }

    if (
      unitPrice !== undefined &&
      (!Number.isFinite(unitPrice) || unitPrice < 0)
    ) {
      return res.status(400).json({ message: "Invalid unit price" });
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      const exists = await Chantier.findById(chantier);
      if (!exists) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    }

    const normalizedReference = reference.trim().toUpperCase();
    const existing = await Material.findOne({
      reference: normalizedReference
    });

    if (existing) {
      return res.status(409).json({ message: "Material reference already exists" });
    }

    const material = await Material.create({
      name: name.trim(),
      reference: normalizedReference,
      category,
      unit,
      quantity: 0,
      minStock: minStock ?? 0,
      unitPrice: unitPrice ?? 0,
      storageLocation,
      chantier: chantier || null,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "Material created. Use a stock movement to add initial quantity.",
      material
    });
  } catch (error) {
    console.error("Create material failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Material reference already exists" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
export const getMaterials = async (req, res) => {
  try {
    const { search, category, chantier, lowStock } = req.query;
    const filter = {};

    if (category) {
      if (!categories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = category;
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }
      filter.chantier = chantier;
    }

    if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$minStock"] };
    }

    let materials = await Material.find(filter)
      .populate("chantier", "name location status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      materials = materials.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        item.reference.toLowerCase().includes(term)
      );
    }

    return res.status(200).json({
      count: materials.length,
      materials
    });
  } catch (error) {
    console.error("Get materials failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getMaterialById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid material ID" });
    }

    const material = await Material.findById(req.params.id)
      .populate("chantier", "name location status")
      .populate("createdBy", "name email");

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json({ material });
  } catch (error) {
    console.error("Get material failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const updateMaterial = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid material ID" });
    }

    const allowed = [
      "name", "category", "unit", "minStock",
      "unitPrice", "storageLocation", "chantier"
    ];

    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.body.quantity !== undefined) {
      return res.status(400).json({
        message: "Use stock movements to change material quantity"
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updates.category && !categories.includes(updates.category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (updates.unit && !units.includes(updates.unit)) {
      return res.status(400).json({ message: "Invalid unit" });
    }

    if (
      updates.minStock !== undefined &&
      (!Number.isFinite(updates.minStock) || updates.minStock < 0)
    ) {
      return res.status(400).json({ message: "Invalid minimum stock" });
    }

    if (
      updates.unitPrice !== undefined &&
      (!Number.isFinite(updates.unitPrice) || updates.unitPrice < 0)
    ) {
      return res.status(400).json({ message: "Invalid unit price" });
    }

    if (updates.chantier) {
      if (!mongoose.isValidObjectId(updates.chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      const exists = await Chantier.findById(updates.chantier);
      if (!exists) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    } else if (updates.chantier === "") {
      updates.chantier = null;
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("chantier", "name location status");

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    return res.status(200).json({
      message: "Material updated successfully",
      material
    });
  } catch (error) {
    console.error("Update material failed:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
