
const ALLOWED_ROLES = ["admin", "manager", "employee"];

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      roles.length === 0 ||
      roles.some((role) => !ALLOWED_ROLES.includes(role))
    ) {
      console.error("Invalid role configuration in route");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to perform this action",
      });
    }

    return next();
  };
};
