import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Chantier from "../models/Chantier.js";

export const getAttendances = async (req, res, next) => {
  try {
    const { employee, chantier, status, startDate, endDate } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (chantier) filter.chantier = chantier;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const attendances = await Attendance.find(filter)
      .populate({
        path: "employee",
        populate: { path: "user", select: "name email" },
      })
      .populate("chantier", "name location")
      .populate("createdBy", "name email")
      .sort({ date: -1 });

    res.status(200).json({
      count: attendances.length,
      attendances,
    });
  } catch (error) {
    next(error);
  }
};

