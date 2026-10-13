
import express from "express";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getChantierExpenseSummary,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin", "manager"));

router.get("/", getExpenses);
router.get("/summary/:chantierId", getChantierExpenseSummary);
router.get("/:id", getExpenseById);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
