import mongoose from "mongoose";
import Equipment from "../models/Equipment.js";
import Chantier from "../models/Chantier.js";

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
      purchasePrice
    } = req.body;

    if (
      !name?.trim() ||
      !reference?.trim() ||
      !category ||
      quantity === undefined
    ) {
      return res.status(400).json({
        message: "Name, reference, category and quantity are required"
      });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        message: "Quantity must be a non-negative integer"
      });
    }

    if (
      purchasePrice !== undefined &&
      (!Number.isFinite(purchasePrice) || purchasePrice < 0)
    ) {
      return res.status(400).json({ message: "Invalid purchase price" });
    }

    if (purchaseDate && Number.isNaN(Date.parse(purchaseDate))) {
      return res.status(400).json({ message: "Invalid purchase date" });
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

    const existingEquipment = await Equipment.findOne({
      reference: reference.trim().toUpperCase()
    });

    if (existingEquipment) {
      return res.status(409).json({
        message: "Equipment reference already exists"
      });
    }
     const equipment = await Equipment.create({
      name,
      reference,
      category,
      description,
      quantity,
      condition,
      status,
      chantier: chantier || null,
      purchaseDate: purchaseDate || null,
      purchasePrice: purchasePrice ?? 0,
      createdBy: req.user.id
    });

    return res.status(201).json({
      message: "Equipment created successfully",
      equipment
    });
  } catch (error) {
    console.error("Create equipment failed:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Equipment reference already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
export const getEquipments = async (req, res) => {
  try {
    const { search, category, condition, status, chantier } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (status) filter.status = status;

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      filter.chantier = chantier;
    }

    const equipments = await Equipment.find(filter)
      .populate("chantier", "name location status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const results = search
      ? equipments.filter((item) => {
          const term = search.toLowerCase();

          return (
            item.name.toLowerCase().includes(term) ||
            item.reference.toLowerCase().includes(term)
          );
        })
      : equipments;

    return res.status(200).json({
      count: results.length,
      equipments: results
    });
  } catch (error) {
    console.error("Get equipments failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
