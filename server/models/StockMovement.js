
import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const StockMovement = mongoose.model(
  "StockMovement",
  stockMovementSchema
);

export default StockMovement;
