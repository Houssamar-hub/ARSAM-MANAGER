import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({
  message = "Chargement des données en cours...",
  fullPage = false,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-blue-600 mb-3`}
      />
      {message && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
