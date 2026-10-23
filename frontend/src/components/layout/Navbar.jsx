import { Menu, LogOut, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleInfo } from "../../utils/formatters.js";
import Badge from "../common/Badge.jsx";

export const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const roleInfo = getRoleInfo(user?.role);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Tableau de bord";
    if (path.startsWith("/chantiers")) return "Gestion des Chantiers";
    if (path.startsWith("/materiaux")) return "Stock & Matériaux";
    return "ARSAM MANAGER";
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">
            {getPageTitle()}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            ARSAM TRAVAUX SARL • Système de gestion BTP
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* API connection indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Connectée</span>
        </div>

        {/* User profile capsule */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900">
              {user?.name || "Collaborateur"}
            </p>
            <div className="mt-0.5">
              <Badge className={roleInfo.badgeClass}>{roleInfo.label}</Badge>
            </div>
          </div>

          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>

          <button
            type="button"
            onClick={logout}
            title="Se déconnecter"
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
