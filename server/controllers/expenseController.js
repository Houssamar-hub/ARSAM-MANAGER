
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

export const updateExpense = async (req, res, next) => {
  try {
    const allowedFields = [
      "chantier",
      "title",
      "description",
      "category",
      "amount",
      "expenseDate",
      "paymentMethod",
      "receipt",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided",
      });
    }

    if (updates.amount !== undefined) {
      updates.amount = Number(updates.amount);

      if (!Number.isFinite(updates.amount) || updates.amount <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than zero",
        });
      }
    }

    if (updates.title !== undefined && !updates.title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (
      updates.expenseDate !== undefined &&
      Number.isNaN(Date.parse(updates.expenseDate))
    ) {
      return res.status(400).json({ message: "Invalid expense date" });
    }

    if (updates.chantier) {
      const chantierExists = await Chantier.findById(updates.chantier);

      if (!chantierExists) {
        return res.status(404).json({ message: "Chantier not found" });
      }
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getChantierExpenseSummary = async (req, res, next) => {
  try {
    const chantier = await Chantier.findById(req.params.chantierId);

    if (!chantier) {
      return res.status(404).json({ message: "Chantier not found" });
    }

    const result = await Expense.aggregate([
      {
        $match: {
          chantier: chantier._id,
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpenses = result.reduce(
      (total, item) => total + item.total,
      0
    );

    res.status(200).json({
      chantier: {
        id: chantier._id,
        name: chantier.name,
        budget: chantier.budget,
      },
      totalExpenses,
      remainingBudget:
        typeof chantier.budget === "number"
          ? chantier.budget - totalExpenses
          : null,
      categories: result,
    });
  } catch (error) {
    next(error);
  }
};
