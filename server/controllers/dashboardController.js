import Chantier from "../models/Chantier.js";
import Employee from "../models/Employee.js";
import Equipment from "../models/Equipment.js";
import Material from "../models/Material.js";
import Expense from "../models/Expense.js";
import Attendance from "../models/Attendance.js";
import StockMovement from "../models/StockMovement.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
