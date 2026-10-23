import { FolderOpen } from "lucide-react";
import Button from "./Button.jsx";

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "Aucune donnée disponible",
  message = "Aucun enregistrement ne correspond à vos critères actuels.",
  actionLabel,
  onAction,
  actionIcon,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
