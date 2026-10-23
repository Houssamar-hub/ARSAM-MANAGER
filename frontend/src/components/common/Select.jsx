export const Select = ({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Sélectionnez une option",
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const selectId = id || name;

  return (
    <div className={`w-full group ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-2xs">
        <select
          id={selectId}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl text-sm font-medium transition-all duration-150 bg-white pl-3.5 pr-10 py-2.5 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.75%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat ${
            error
              ? "border border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/15"
              : "border border-slate-300 text-slate-900 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:shadow-xs"
          } ${
            disabled
              ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : ""
          }`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
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

export default Select;
