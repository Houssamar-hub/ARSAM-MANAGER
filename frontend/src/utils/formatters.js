import {
  CHANTIER_STATUSES,
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  USER_ROLES,
} from "./constants.js";

export const formatMAD = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0 MAD";
  }
  const numeric = Number(value);
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numeric);
};

export const formatNumber = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0";
  }
  return new Intl.NumberFormat("fr-FR").format(Number(value));
};

export const formatDate = (dateValue) => {
  if (!dateValue) return "Non définie";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "Invalide";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "Invalide";
  }
};

export const formatDateInput = (dateValue) => {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export const getCategoryLabel = (category) => {
  const found = MATERIAL_CATEGORIES.find((item) => item.value === category);
  return found ? found.label : category || "Non classé";
};

export const getUnitLabel = (unit, short = false) => {
  const found = MATERIAL_UNITS.find((item) => item.value === unit);
  if (!found) return unit || "";
  return short ? found.short : found.label;
};

export const getStatusInfo = (status) => {
  return (
    CHANTIER_STATUSES[status] || {
      key: status,
      label: status || "Inconnu",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      dotClass: "bg-slate-400",
    }
  );
};

export const getRoleInfo = (role) => {
  return (
    USER_ROLES[role] || {
      key: role,
      label: role || "Utilisateur",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
};
