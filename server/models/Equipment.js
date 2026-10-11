
import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: [
        "machinery",
        "vehicle",
        "tool",
        "safety",
        "other"
      ],
      required: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer"
      }
    },
    condition: {
      type: String,
      enum: ["new", "good", "damaged", "maintenance"],
      default: "good"
    },
    status: {
      type: String,
      enum: ["available", "assigned", "unavailable"],
      default: "available"
    },
    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      default: null
    },
    purchaseDate: {
      type: Date,
      default: null
    },
    purchasePrice: {
      type: Number,
      min: 0,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const Equipment = mongoose.model("Equipment", equipmentSchema);

export default Equipment;
