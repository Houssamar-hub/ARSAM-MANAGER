export const Badge = ({
  children,
  variant = "default",
  className = "",
  dot = false,
  dotClass = "",
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotClass || "bg-current"
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
