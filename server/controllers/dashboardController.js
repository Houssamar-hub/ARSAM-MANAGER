
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

    const [
      totalChantiers,
      plannedChantiers,
      activeChantiers,
      completedChantiers,
      totalEmployees,
      activeEmployees,
      totalEquipments,
      availableEquipments,
      totalMaterials,
      lowStockMaterials,
      stockValue,
      totalExpenses,
      monthlyExpenses,
      todayAttendance,
      totalStockEntries,
      totalStockExits,
      recentChantiers,
    ] = await Promise.all([
      Chantier.countDocuments(),

      Chantier.countDocuments({ status: "planned" }),

      Chantier.countDocuments({ status: "in_progress" }),

      Chantier.countDocuments({ status: "completed" }),

      Employee.countDocuments(),

      Employee.countDocuments({ status: "active" }),

      Equipment.countDocuments(),

      Equipment.countDocuments({ status: "available" }),

      Material.countDocuments(),

      Material.countDocuments({
        $expr: { $lte: ["$quantity", "$minStock"] },
      }),

      Material.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ["$quantity", "$unitPrice"],
              },
            },
          },
        },
      ]),

      Expense.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            expenseDate: { $gte: startOfMonth, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
      ]),
      StockMovement.countDocuments({
        type: "in",
      }),

      StockMovement.countDocuments({
        type: "out",
      }),

      Chantier.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name location status budget startDate endDate"),
    ]);

    const attendanceStats = {
      present: 0,
      absent: 0,
      late: 0,
      on_leave: 0,
    };

    for (const item of todayAttendance) {
      attendanceStats[item._id] = item.total;
    }

    res.status(200).json({
      success: true,
      dashboard: {
        chantiers: {
          total: totalChantiers,
          planned: plannedChantiers,
          inProgress: activeChantiers,
          completed: completedChantiers,
        },

        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
        },

        equipments: {
          total: totalEquipments,
          available: availableEquipments,
          unavailable: totalEquipments - availableEquipments,
        },

        materials: {
          total: totalMaterials,
          lowStock: lowStockMaterials,
          stockValue: stockValue[0]?.total || 0,
        },

        expenses: {
          total: totalExpenses[0]?.total || 0,
          thisMonth: monthlyExpenses[0]?.total || 0,
        },

        attendance: attendanceStats,

        stockMovements: {
          totalEntries: totalStockEntries,
          totalExits: totalStockExits,
        },

        recentChantiers,
        generatedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};
