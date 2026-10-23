export const StatCard = ({
  title,
  value,
  detail,
  icon: Icon,
  color = "blue",
  alert = false,
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      iconBg: "bg-blue-600 text-white",
      highlight: "hover:border-blue-300",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      iconBg: "bg-emerald-600 text-white",
      highlight: "hover:border-emerald-300",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      iconBg: "bg-amber-600 text-white",
      highlight: "hover:border-amber-300",
    },
    rose: {
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      iconBg: "bg-rose-600 text-white",
      highlight: "hover:border-rose-300",
    },
    purple: {
      bg: "bg-purple-50 text-purple-600 border-purple-100",
      iconBg: "bg-purple-600 text-white",
      highlight: "hover:border-purple-300",
    },
    slate: {
      bg: "bg-slate-50 text-slate-600 border-slate-100",
      iconBg: "bg-slate-700 text-white",
      highlight: "hover:border-slate-300",
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs transition-all ${
        onClick ? `cursor-pointer ${scheme.highlight} hover:shadow-md` : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
          </div>
          {detail && (
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              {alert && (
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
              {detail}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${scheme.iconBg}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
