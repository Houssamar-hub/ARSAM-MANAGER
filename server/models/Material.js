
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
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
        "cement",
        "iron",
        "sand",
        "gravel",
        "wood",
        "paint",
        "electrical",
        "plumbing",
        "other"
      ],
      required: true
    },
    unit: {
      type: String,
      enum: ["piece", "kg", "ton", "bag", "m3", "liter", "meter"],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minStock: {
      type: Number,
      min: 0,
      default: 0
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    storageLocation: {
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

const Material = mongoose.model("Material", materialSchema);

export default Material;
