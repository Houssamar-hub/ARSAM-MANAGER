import { Loader2 } from "lucide-react";

export const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  isLoading = false,
  icon: Icon,
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm",
    secondary:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-blue-500 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm",
    outline:
      "border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
