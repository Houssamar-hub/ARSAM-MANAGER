import mongoose from "mongoose";
import Material from "../models/Material.js";
import Chantier from "../models/Chantier.js";
import StockMovement from "../models/StockMovement.js";

export const createStockMovement = async (req, res) => {
  let updatedMaterial = false;
  let delta = 0;
  let materialId = null;

  try {
    const { material, type, quantity, unitPrice, reason, chantier } = req.body;

    if (!material || !type || quantity === undefined) {
      return res.status(400).json({
        message: "Material, type and quantity are required"
      });
    }

    if (!mongoose.isValidObjectId(material)) {
      return res.status(400).json({ message: "Invalid material ID" });
    }

    if (!["in", "out"].includes(type)) {
      return res.status(400).json({ message: "Type must be in or out" });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }

    if (
      unitPrice !== undefined &&
      (!Number.isFinite(unitPrice) || unitPrice < 0)
    ) {
      return res.status(400).json({ message: "Invalid unit price" });
    }

    const existingMaterial = await Material.findById(material);

    if (!existingMaterial) {
      return res.status(404).json({ message: "Material not found" });
    }

    const movementChantier = chantier || existingMaterial.chantier || null;

    if (movementChantier) {
      if (!mongoose.isValidObjectId(movementChantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }

      const exists = await Chantier.findById(movementChantier);

      if (!exists) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    }

    delta = type === "in" ? quantity : -quantity;
    materialId = existingMaterial._id;

    const filter = { _id: materialId };

    if (type === "out") {
      filter.quantity = { $gte: quantity };
    }

    const updated = await Material.findOneAndUpdate(
      filter,
      { $inc: { quantity: delta } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(400).json({
        message: "Insufficient stock for this operation"
      });
    }

    updatedMaterial = true;

    let movement;

    try {
      movement = await StockMovement.create({
        material: materialId,
        type,
        quantity,
        unitPrice: unitPrice ?? existingMaterial.unitPrice,
        reason,
        chantier: movementChantier,
        createdBy: req.user.id
      });
    } catch (error) {
      await Material.updateOne(
        { _id: materialId },
        { $inc: { quantity: -delta } }
      );

      updatedMaterial = false;
      throw error;
    }

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate("material", "name reference unit quantity")
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    return res.status(201).json({
      message: "Stock movement created successfully",
      movement: populatedMovement,
      currentQuantity: updated.quantity
    });
  } catch (error) {
    console.error("Create stock movement failed:", error);

    if (updatedMaterial && materialId) {
      try {
        await Material.updateOne(
          { _id: materialId },
          { $inc: { quantity: -delta } }
        );
      } catch (rollbackError) {
        console.error("Stock rollback failed:", rollbackError);
      }
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

export const getStockMovements = async (req, res) => {
  try {
    const { material, type, chantier } = req.query;
    const filter = {};

    if (material) {
      if (!mongoose.isValidObjectId(material)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      filter.material = material;
    }

    if (type) {
      if (!["in", "out"].includes(type)) {
        return res.status(400).json({ message: "Invalid movement type" });
      }
      filter.type = type;
    }

    if (chantier) {
      if (!mongoose.isValidObjectId(chantier)) {
        return res.status(400).json({ message: "Invalid chantier ID" });
      }
      filter.chantier = chantier;
    }

    const movements = await StockMovement.find(filter)
      .populate("material", "name reference unit")
      .populate("chantier", "name location")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: movements.length,
      movements
    });
  } catch (error) {
    console.error("Get stock movements failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getStockMovementById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid movement ID" });
    }

    const movement = await StockMovement.findById(req.params.id)
      .populate("material", "name reference unit")
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }

    return res.status(200).json({ movement });
  } catch (error) {
    console.error("Get stock movement failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};