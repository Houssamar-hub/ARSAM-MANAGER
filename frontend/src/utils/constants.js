export const CHANTIER_STATUSES = {
  planned: {
    key: "planned",
    label: "Planifié",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20",
    dotClass: "bg-amber-500",
  },
  in_progress: {
    key: "in_progress",
    label: "En cours",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20",
    dotClass: "bg-blue-600 animate-pulse",
  },
  completed: {
    key: "completed",
    label: "Terminé",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20",
    dotClass: "bg-emerald-600",
  },
  suspended: {
    key: "suspended",
    label: "Suspendu",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20",
    dotClass: "bg-rose-500",
  },
};

export const MATERIAL_CATEGORIES = [
  { value: "cement", label: "Ciment" },
  { value: "iron", label: "Fer & Acier" },
  { value: "sand", label: "Sable" },
  { value: "gravel", label: "Gravier" },
  { value: "wood", label: "Bois & Coffrage" },
  { value: "paint", label: "Peinture & Finition" },
  { value: "electrical", label: "Électricité" },
  { value: "plumbing", label: "Plomberie & Sanitaire" },
  { value: "other", label: "Autre matériel" },
];

export const MATERIAL_UNITS = [
  { value: "piece", label: "Pièce(s)", short: "pcs" },
  { value: "kg", label: "Kilogramme (kg)", short: "kg" },
  { value: "ton", label: "Tonne (t)", short: "t" },
  { value: "bag", label: "Sac(s)", short: "sac" },
  { value: "m3", label: "Mètre cube (m³)", short: "m³" },
  { value: "liter", label: "Litre (L)", short: "L" },
  { value: "meter", label: "Mètre linéaire (m)", short: "m" },
];

export const USER_ROLES = {
  admin: {
    key: "admin",
    label: "Administrateur",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  manager: {
    key: "manager",
    label: "Conducteur de travaux",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  employee: {
    key: "employee",
    label: "Collaborateur",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
};
