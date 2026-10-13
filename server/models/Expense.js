
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    chantier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chantier",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "materials",
        "equipment",
        "transport",
        "salaries",
        "maintenance",
        "other",
      ],
      default: "other",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "other"],
      default: "cash",
    },
    receipt: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
