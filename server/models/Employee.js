
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee user is required"],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: [30, "Phone cannot exceed 30 characters"],
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [2, "Job title must contain at least 2 characters"],
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    hireDate: {
      type: Date,
      required: [true, "Hire date is required"],
    },
    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
