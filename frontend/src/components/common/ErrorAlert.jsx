import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button.jsx";

export const ErrorAlert = ({
  title = "Une erreur est survenue",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 shadow-xs ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-rose-600 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          {message && (
            <p className="mt-1 text-sm text-rose-700 leading-relaxed">
              {message}
            </p>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                icon={RefreshCw}
                className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-900"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
