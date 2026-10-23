export const Input = ({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = "",
  autoComplete,
  step,
  min,
  max,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className={`w-full group ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-2xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          step={step}
          min={min}
          max={max}
          className={`block w-full rounded-xl text-sm font-medium transition-all duration-150 bg-white ${
            Icon ? "pl-10" : "pl-3.5"
          } pr-3.5 py-2.5 outline-none placeholder:text-slate-400 placeholder:font-normal ${
            error
              ? "border border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/15"
              : "border border-slate-300 text-slate-900 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:shadow-xs"
          } ${
            disabled
              ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : ""
          }`}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
