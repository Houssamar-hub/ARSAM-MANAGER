
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },
    salary: {
      type: Number,
      required: true,
      min: 0
    },
    hireDate: {
      type: Date,
      required: true
    },
    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      default: null
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
