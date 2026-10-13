
import Expense from "../models/Expense.js";
import Chantier from "../models/Chantier.js";

export const getExpenses = async (req, res, next) => {
  try {
    const { chantier, category, startDate, endDate } = req.query;
    const filter = {};

    if (chantier) filter.chantier = chantier;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.expenseDate = {};

      if (startDate) {
        filter.expenseDate.$gte = new Date(startDate);
      }

      if (endDate) {
        const date = new Date(endDate);
        date.setUTCHours(23, 59, 59, 999);
        filter.expenseDate.$lte = date;
      }
    }

    const expenses = await Expense.find(filter)
      .populate("chantier", "name location")
      .populate("createdBy", "name email")
      .sort({ expenseDate: -1 });

    res.status(200).json({
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};