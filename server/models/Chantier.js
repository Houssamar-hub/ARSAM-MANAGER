
import mongoose from "mongoose";

const chantierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Chantier name is required"],
      trim: true,
      minlength: [2, "Chantier name must contain at least 2 characters"],
      maxlength: [150, "Chantier name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    location: {
      type: String,
      required: [true, "Chantier location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },

    budget: {
      type: Number,
      required: [true, "Chantier budget is required"],
      min: [0, "Budget cannot be negative"],
    },

    startDate: {
      type: Date,
      required: [true, "Chantier start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "Chantier end date is required"],
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be after or equal to start date",
      },
    },

    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "suspended"],
      default: "planned",
      required: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Chantier manager is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Chantier creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Chantier = mongoose.model("Chantier", chantierSchema);

export default Chantier;
