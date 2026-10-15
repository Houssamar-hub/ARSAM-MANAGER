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

export const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate({
        path: "employee",
        populate: { path: "user", select: "name email" },
      })
      .populate("chantier", "name location")
      .populate("createdBy", "name email");

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    res.status(200).json({ attendance });
  } catch (error) {
    next(error);
  }
};
export const createAttendance = async (req, res, next) => {
  try {
    const {
      employee,
      chantier,
      date,
      status,
      checkIn,
      checkOut,
      notes,
    } = req.body;

    if (!employee || !date) {
      return res.status(400).json({
        message: "Employee and date are required",
      });
    }

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        message: "Invalid attendance date",
      });
    }

    const attendanceDate = new Date(date);

    if (attendanceDate > new Date()) {
      return res.status(400).json({
        message: "Attendance date cannot be in the future",
      });
    }

    const employeeExists = await Employee.findById(employee);

    if (!employeeExists) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (chantier) {
      const chantierExists = await Chantier.findById(chantier);

      if (!chantierExists) {
        return res.status(404).json({
          message: "Chantier not found",
        });
      }
    }

    if (
      status !== undefined &&
      !["present", "absent", "late", "on_leave"].includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid attendance status",
      });
    }

    const parsedCheckIn = checkIn ? new Date(checkIn) : null;
    const parsedCheckOut = checkOut ? new Date(checkOut) : null;

    if (
      (checkIn && Number.isNaN(parsedCheckIn.getTime())) ||
      (checkOut && Number.isNaN(parsedCheckOut.getTime()))
    ) {
      return res.status(400).json({
        message: "Invalid check-in or check-out time",
      });
    }

    if (
      parsedCheckIn &&
      parsedCheckOut &&
      parsedCheckOut < parsedCheckIn
    ) {
      return res.status(400).json({
        message: "Check-out must be after check-in",
      });
    }

    const startOfDay = new Date(attendanceDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      employee,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(409).json({
        message: "Attendance already exists for this employee and date",
      });
    }

    const attendance = await Attendance.create({
      employee,
      chantier: chantier || null,
      date: attendanceDate,
      status,
      checkIn: parsedCheckIn,
      checkOut: parsedCheckOut,
      notes,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Attendance created successfully",
      attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Attendance already exists for this employee and date",
      });
    }

    next(error);
  }
};
