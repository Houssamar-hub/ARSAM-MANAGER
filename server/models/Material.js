
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
      minlength: [2, "Material name must contain at least 2 characters"],
      maxlength: [150, "Material name cannot exceed 150 characters"],
    },

    reference: {
      type: String,
      required: [true, "Material reference is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, "Reference must contain at least 2 characters"],
      maxlength: [50, "Reference cannot exceed 50 characters"],
    },

    category: {
      type: String,
      enum: [
        "cement",
        "iron",
        "sand",
        "gravel",
        "wood",
        "paint",
        "electrical",
        "plumbing",
        "other",
      ],
      required: [true, "Material category is required"],
    },

    unit: {
      type: String,
      enum: ["piece", "kg", "ton", "bag", "m3", "liter", "meter"],
      required: [true, "Material unit is required"],
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    minStock: {
      type: Number,
      min: [0, "Minimum stock cannot be negative"],
      default: 0,
    },

    unitPrice: {
      type: Number,
      min: [0, "Unit price cannot be negative"],
      default: 0,
    },

    storageLocation: {
      type: String,
      trim: true,
      maxlength: [200, "Storage location cannot exceed 200 characters"],
      default: "",
    },

    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Material creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

materialSchema.index({ category: 1 });
materialSchema.index({ chantier: 1 });
materialSchema.index({ quantity: 1, minStock: 1 });

const Material = mongoose.model("Material", materialSchema);

export default Material;
