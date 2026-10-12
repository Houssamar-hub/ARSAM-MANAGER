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
