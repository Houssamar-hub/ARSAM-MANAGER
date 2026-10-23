import { Link } from "react-router-dom";
import { HardHat, ArrowLeft } from "lucide-react";
import Button from "../components/common/Button.jsx";

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <HardHat className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-semibold text-slate-700 mt-2">Page introuvable</h2>
      <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
        La ressource ou la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/">
        <Button variant="primary" icon={ArrowLeft}>
          Retour au tableau de bord
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
