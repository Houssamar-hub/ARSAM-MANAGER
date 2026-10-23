import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  HardHat,
  LogOut,
  X,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRoleInfo } from "../../utils/formatters.js";
import Badge from "../common/Badge.jsx";

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, canAccessMaterials } = useAuth();
  const roleInfo = getRoleInfo(user?.role);

  const navigation = [
    {
      name: "Tableau de bord",
      to: "/",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Chantiers",
      to: "/chantiers",
      icon: Building2,
      show: true,
    },
    {
      name: "Matériaux & Stock",
      to: "/materiaux",
      icon: Boxes,
      show: canAccessMaterials,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight text-slate-900">
                ARSAM TRAVAUX
              </span>
              <span className="block text-2xs font-semibold uppercase tracking-wider text-blue-600">
                SARL • Construction
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 pb-2 text-2xs font-bold uppercase tracking-wider text-slate-400">
            Gestion du Chantier
          </p>
          <nav className="space-y-1.5">
            {navigation
              .filter((item) => item.show)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => onClose?.()}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`h-5 w-5 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="flex items-center gap-3 rounded-xl p-2 bg-white border border-slate-200/70 shadow-2xs">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCheck className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {user?.name || "Utilisateur"}
              </p>
              <div className="mt-0.5">
                <Badge className={roleInfo.badgeClass}>
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Déconnexion"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
