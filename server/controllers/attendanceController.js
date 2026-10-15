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
export const updateAttendance = async (req, res, next) => {
  try {
    const allowedFields = [
      "employee",
      "chantier",
      "date",
      "status",
      "checkIn",
      "checkOut",
      "notes",
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

    if (updates.employee) {
      const employeeExists = await Employee.findById(updates.employee);

      if (!employeeExists) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }
    }

    if (updates.chantier) {
      const chantierExists = await Chantier.findById(updates.chantier);

      if (!chantierExists) {
        return res.status(404).json({
          message: "Chantier not found",
        });
      }
    }

    if (updates.date !== undefined) {
      if (Number.isNaN(Date.parse(updates.date))) {
        return res.status(400).json({
          message: "Invalid attendance date",
        });
      }

      updates.date = new Date(updates.date);
    }

    if (
      updates.status !== undefined &&
      !["present", "absent", "late", "on_leave"].includes(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid attendance status",
      });
    }

    for (const field of ["checkIn", "checkOut"]) {
      if (updates[field] === null || updates[field] === "") {
        updates[field] = null;
      } else if (updates[field] !== undefined) {
        const parsed = new Date(updates[field]);

        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({
            message: `Invalid ${field} time`,
          });
        }

        updates[field] = parsed;
      }
    }

    const current = await Attendance.findById(req.params.id);

    if (!current) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    const employeeId = updates.employee || current.employee;
    const attendanceDate = updates.date || current.date;

    const startOfDay = new Date(attendanceDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const duplicate = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
      _id: { $ne: current._id },
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Attendance already exists for this employee and date",
      });
    }

    const checkIn = updates.checkIn !== undefined
      ? updates.checkIn
      : current.checkIn;

    const checkOut = updates.checkOut !== undefined
      ? updates.checkOut
      : current.checkOut;

    if (checkIn && checkOut && checkOut < checkIn) {
      return res.status(400).json({
        message: "Check-out must be after check-in",
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate({
        path: "employee",
        populate: { path: "user", select: "name email" },
      })
      .populate("chantier", "name location");

    res.status(200).json({
      message: "Attendance updated successfully",
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
