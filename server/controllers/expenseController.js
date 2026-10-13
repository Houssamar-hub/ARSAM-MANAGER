
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

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ expense });
  } catch (error) {
    next(error);
  }
};
export const createExpense = async (req, res, next) => {
  try {
    const {
      chantier,
      title,
      description,
      category,
      amount,
      expenseDate,
      paymentMethod,
      receipt,
    } = req.body;

    if (!chantier || !title?.trim() || amount === undefined) {
      return res.status(400).json({
        message: "Chantier, title and amount are required",
      });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    if (expenseDate && Number.isNaN(Date.parse(expenseDate))) {
      return res.status(400).json({
        message: "Invalid expense date",
      });
    }

    const chantierExists = await Chantier.findById(chantier);

    if (!chantierExists) {
      return res.status(404).json({ message: "Chantier not found" });
    }

    const expense = await Expense.create({
      chantier,
      title,
      description,
      category,
      amount: parsedAmount,
      expenseDate,
      paymentMethod,
      receipt,
      createdBy: req.user.id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    res.status(201).json({
      message: "Expense created successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};
