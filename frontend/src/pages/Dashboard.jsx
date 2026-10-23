import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Boxes,
  AlertTriangle,
  ClipboardList,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Coins,
  ShieldCheck,
} from "lucide-react";
import chantiersApi from "../api/chantiers.js";
import materialsApi from "../api/materials.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  formatMAD,
  formatNumber,
  getStatusInfo,
  getCategoryLabel,
  getUnitLabel,
} from "../utils/formatters.js";
import StatCard from "../components/common/StatCard.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ErrorAlert from "../components/common/ErrorAlert.jsx";
import EmptyState from "../components/common/EmptyState.jsx";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { canAccessMaterials, canManageChantiers } = useAuth();

  const [chantiers, setChantiers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch Chantiers
      const chantiersRes = await chantiersApi.getAll();
      if (!chantiersRes?.success) {
        throw new Error(
          chantiersRes?.message || "Impossible de charger les chantiers"
        );
      }
      setChantiers(chantiersRes.chantiers || []);

      // If user has materials permission, fetch materials
      if (canAccessMaterials) {
        try {
          const materialsRes = await materialsApi.getAll();
          if (materialsRes?.success) {
            setMaterials(materialsRes.materials || []);
          }
        } catch (matErr) {
          console.warn("Materials fetch warning:", matErr?.message);
        }
      }
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
      setError(
        err.message ||
          "Impossible de charger les données réelles du tableau de bord"
      );
    } finally {
      setIsLoading(false);
    }
  }, [canAccessMaterials]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const [ person, setPerson ] = useState({
    name: "oussama",
    age: 24,
    job: "instructor"
})


  function changeData() {
      setPerson({...person, name: "houssam", job: "student"})
  }

  // Real statistics calculated strictly from actual backend records
  const stats = useMemo(() => {
    const totalChantiersCount = chantiers.length;
    const inProgressCount = chantiers.filter(
      (c) => c.status === "in_progress"
    ).length;
    const totalBudget = chantiers.reduce(
      (sum, c) => sum + (Number(c.budget) || 0),
      0
    );

    const totalMaterialsCount = materials.length;
    const lowStockMaterials = materials.filter(
      (m) => Number(m.quantity) <= Number(m.minStock)
    );
    const lowStockCount = lowStockMaterials.length;

    const totalStockValue = materials.reduce((sum, m) => {
      const q = Number(m.quantity) || 0;
      const p = Number(m.unitPrice) || 0;
      return sum + q * p;
    }, 0);

    // Distribution by actual status
    const statusCounts = {
      in_progress: inProgressCount,
      planned: chantiers.filter((c) => c.status === "planned").length,
      completed: chantiers.filter((c) => c.status === "completed").length,
      suspended: chantiers.filter((c) => c.status === "suspended").length,
    };

    return {
      totalChantiersCount,
      inProgressCount,
      totalBudget,
      totalMaterialsCount,
      lowStockCount,
      lowStockMaterials,
      totalStockValue,
      statusCounts,
    };
  }, [chantiers, materials]);

  const recentChantiers = useMemo(() => {
    return chantiers.slice(0, 5);
  }, [chantiers]);

  const recentLowStock = useMemo(() => {
    return stats.lowStockMaterials.slice(0, 5);
  }, [stats.lowStockMaterials]);

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Tableau de Bord Exécutif
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Aperçu en temps réel de l'activité des chantiers et du stock
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            icon={RefreshCw}
            disabled={isLoading}
          >
            Actualiser
          </Button>

          {canManageChantiers && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate("/chantiers")}
            >
              Gérer les chantiers
            </Button>
          )}
        </div>
      </div>

      {/* Error state if request failed */}
      {error && (
        <ErrorAlert
          title="Erreur de synchronisation API"
          message={error}
          onRetry={fetchDashboardData}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16">
          <LoadingSpinner message="Calcul des indicateurs à partir de la base de données..." />
        </div>
      ) : (
        <>
          {/* Real KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Chantiers"
              value={formatNumber(stats.totalChantiersCount)}
              detail={`${stats.inProgressCount} chantier(s) actuellement en cours`}
              icon={Building2}
              color="blue"
              onClick={() => navigate("/chantiers")}
            />

            <StatCard
              title="Chantiers en cours"
              value={formatNumber(stats.inProgressCount)}
              detail={
                stats.totalChantiersCount > 0
                  ? `${Math.round(
                      (stats.inProgressCount / stats.totalChantiersCount) * 100
                    )}% des projets actifs`
                  : "Aucun chantier actif"
              }
              icon={TrendingUp}
              color="emerald"
              onClick={() => navigate("/chantiers")}
            />

            <StatCard
              title="Budget cumulé chantiers"
              value={formatMAD(stats.totalBudget)}
              detail="Total alloué aux projets enregistrés"
              icon={ClipboardList}
              color="purple"
            />

            {canAccessMaterials ? (
              <>
                <StatCard
                  title="Références Matériaux"
                  value={formatNumber(stats.totalMaterialsCount)}
                  detail="Articles enregistrés en stock"
                  icon={Boxes}
                  color="blue"
                  onClick={() => navigate("/materiaux")}
                />

                <StatCard
                  title="Articles en stock critique"
                  value={formatNumber(stats.lowStockCount)}
                  detail={
                    stats.lowStockCount > 0
                      ? "Quantité actuelle ≤ Stock minimal"
                      : "Tous les stocks sont au-dessus du seuil"
                  }
                  icon={AlertTriangle}
                  color={stats.lowStockCount > 0 ? "rose" : "slate"}
                  alert={stats.lowStockCount > 0}
                  onClick={() => navigate("/materiaux")}
                />

                <StatCard
                  title="Valeur du stock enregistré"
                  value={formatMAD(stats.totalStockValue)}
                  detail="Calculé à partir des quantités × prix d'achat"
                  icon={Coins}
                  color="amber"
                  onClick={() => navigate("/materiaux")}
                />
              </>
            ) : (
              <div className="sm:col-span-2 lg:col-span-3 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Module Matériaux & Stocks
                    </h4>
                    <p className="text-xs text-slate-500">
                      Votre profil de collaborateur a accès au suivi opérationnel des chantiers.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/chantiers")}
                >
                  Voir les chantiers
                </Button>
              </div>
            )}
          </div>

          {/* Status Breakdown & Navigation Shortcuts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Status Distribution */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                Répartition des chantiers
              </h3>

              {stats.totalChantiersCount === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aucun chantier enregistré dans la base de données.
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { key: "in_progress", label: "En cours", color: "bg-blue-600" },
                    { key: "planned", label: "Planifié", color: "bg-amber-500" },
                    { key: "completed", label: "Terminé", color: "bg-emerald-600" },
                    { key: "suspended", label: "Suspendu", color: "bg-rose-500" },
                  ].map((item) => {
                    const count = stats.statusCounts[item.key] || 0;
                    const percent =
                      stats.totalChantiersCount > 0
                        ? Math.round((count / stats.totalChantiersCount) * 100)
                        : 0;

                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="text-slate-900">
                            {count} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation Shortcuts */}
              <div className="mt-6 border-t border-slate-100 pt-5 space-y-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Raccourcis rapides
                </p>
                <Link
                  to="/chantiers"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Consulter la liste des chantiers
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                {canAccessMaterials && (
                  <Link
                    to="/materiaux"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      Gérer le stock des matériaux
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Chantiers */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Chantiers Récents
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Derniers projets enregistrés dans le système
                  </p>
                </div>
                <Link
                  to="/chantiers"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Voir tous ({stats.totalChantiersCount})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentChantiers.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="Aucun chantier enregistré"
                  message="La base de données ne contient aucun chantier pour l'instant."
                  actionLabel={canManageChantiers ? "Créer un chantier" : null}
                  actionIcon={Plus}
                  onAction={() => navigate("/chantiers")}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Nom</th>
                        <th className="pb-3">Localisation</th>
                        <th className="pb-3">Budget</th>
                        <th className="pb-3">Statut</th>
                        <th className="pb-3 text-right">Conducteur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                      {recentChantiers.map((c) => {
                        const statusInfo = getStatusInfo(c.status);
                        return (
                          <tr
                            key={c._id}
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                            onClick={() => navigate("/chantiers")}
                          >
                            <td className="py-3 font-semibold text-slate-900">
                              {c.name}
                            </td>
                            <td className="py-3 text-slate-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {c.location}
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-slate-900">
                              {formatMAD(c.budget)}
                            </td>
                            <td className="py-3">
                              <Badge
                                className={statusInfo.badgeClass}
                                dot
                                dotClass={statusInfo.dotClass}
                              >
                                {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="py-3 text-right text-slate-600">
                              {c.manager?.name || "Non assigné"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Materials Alert Section */}
          {canAccessMaterials && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Alertes Réapprovisionnement & Stock Faible
                    </h3>
                    <p className="text-xs text-slate-500">
                      Matériaux dont le stock actuel est inférieur ou égal au seuil de sécurité
                    </p>
                  </div>
                </div>

                <Link
                  to="/materiaux"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Voir tout le stock
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentLowStock.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50/60 border border-emerald-200 p-4 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-medium">
                    Excellent ! Aucun matériau n'est en situation de stock critique. Tous les articles enregistrés respectent les seuils minimaux.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Réf</th>
                        <th className="pb-3">Matériau</th>
                        <th className="pb-3">Catégorie</th>
                        <th className="pb-3">Stock Actuel</th>
                        <th className="pb-3">Seuil Min</th>
                        <th className="pb-3">Affectation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                      {recentLowStock.map((m) => (
                        <tr
                          key={m._id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate("/materiaux")}
                        >
                          <td className="py-3 font-mono text-2xs font-bold text-slate-500">
                            {m.reference}
                          </td>
                          <td className="py-3 font-semibold text-slate-900">
                            {m.name}
                          </td>
                          <td className="py-3">
                            <Badge variant="default">
                              {getCategoryLabel(m.category)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className="font-bold text-rose-600">
                              {formatNumber(m.quantity)} {getUnitLabel(m.unit, true)}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {formatNumber(m.minStock)} {getUnitLabel(m.unit, true)}
                          </td>
                          <td className="py-3 text-slate-500">
                            {m.chantier?.name ? (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {m.chantier.name}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">
                                Dépôt général
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
