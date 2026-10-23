import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Building2,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import materialsApi from "../../api/materials.js";
import chantiersApi from "../../api/chantiers.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  formatMAD,
  formatNumber,
  getCategoryLabel,
  getUnitLabel,
} from "../../utils/formatters.js";
import { MATERIAL_CATEGORIES } from "../../utils/constants.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Badge from "../../components/common/Badge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import MaterialFormModal from "./MaterialFormModal.jsx";
import MaterialDetailModal from "./MaterialDetailModal.jsx";

export const MaterialsList = () => {
  const { canAccessMaterials, canManageMaterials, canDeleteMaterials } =
    useAuth();

  const [materials, setMaterials] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [chantierFilter, setChantierFilter] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Load chantiers for selector
  const fetchChantiersList = useCallback(async () => {
    try {
      const res = await chantiersApi.getAll();
      if (res?.success) {
        setChantiers(res.chantiers || []);
      }
    } catch (err) {
      console.warn("Could not fetch chantiers for filter:", err);
    }
  }, []);

  // Fetch materials from API
  const fetchMaterials = useCallback(async () => {
    if (!canAccessMaterials) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (chantierFilter) params.chantier = chantierFilter;
      if (onlyLowStock) params.lowStock = "true";

      const res = await materialsApi.getAll(params);
      if (res?.success) {
        setMaterials(res.materials || []);
      } else {
        throw new Error(res?.message || "Échec de récupération des matériaux");
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError(err.message || "Impossible de charger l'inventaire des matériaux");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, chantierFilter, onlyLowStock, canAccessMaterials]);

  useEffect(() => {
    fetchChantiersList();
  }, [fetchChantiersList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMaterials]);

  // Total stock value calculation from actual API data
  const totalStockValue = useMemo(() => {
    return materials.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [materials]);

  // Low stock count in currently loaded list
  const lowStockCount = useMemo(() => {
    return materials.filter((item) => Number(item.quantity) <= Number(item.minStock)).length;
  }, [materials]);

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await materialsApi.delete(deletingMaterial._id);
      if (res?.success) {
        setDeletingMaterial(null);
        fetchMaterials();
      } else {
        throw new Error(res?.message || "Erreur lors de la suppression");
      }
    } catch (err) {
      setDeleteError(err.message || "Erreur de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // If user is employee, display permission restriction notice
  if (!canAccessMaterials) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Accès restreint au module Matériaux
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Le module de gestion des matériaux et du stock est réservé aux
          administrateurs et conducteurs de travaux (managers).
        </p>
      </div>
    );
  }

  const categoryOptions = MATERIAL_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const chantierFilterOptions = chantiers.map((c) => ({
    value: c._id,
    label: `${c.name} (${c.location})`,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Stock & Matériaux de Construction
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Inventaire des matériaux BTP, suivi des stocks minimaux et valorisation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchMaterials}
            icon={RefreshCw}
            disabled={isLoading}
          >
            Actualiser
          </Button>

          {canManageMaterials && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingMaterial(null);
                setIsFormOpen(true);
              }}
            >
              Nouveau matériau
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Références totales
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(materials.length)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Articles répertoriés</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Stock à surveiller
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                lowStockCount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {formatNumber(lowStockCount)}
            </span>
            {lowStockCount > 0 && (
              <Badge variant="rose" dot dotClass="bg-rose-500 animate-pulse">
                Alerte seuil
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Articles ≤ stock min</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Valeur totale enregistrée
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatMAD(totalStockValue)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Calculé (Qté × Prix Unitaire)</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            id="searchMaterial"
            name="searchMaterial"
            type="search"
            placeholder="Rechercher par nom ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />

          <Select
            id="categoryFilter"
            name="categoryFilter"
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Toutes les catégories"
          />

          <Select
            id="chantierFilter"
            name="chantierFilter"
            options={chantierFilterOptions}
            value={chantierFilter}
            onChange={(e) => setChantierFilter(e.target.value)}
            placeholder="Tous les chantiers affectés"
          />

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOnlyLowStock((prev) => !prev)}
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                onlyLowStock
                  ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>{onlyLowStock ? "Filtre actif : Stock faible" : "Afficher stock faible seul"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete error notification */}
      {deleteError && (
        <ErrorAlert
          title="Impossible de supprimer le matériau"
          message={deleteError}
        />
      )}

      {/* Content Section */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12">
          <LoadingSpinner message="Chargement des matériaux depuis la base de données..." />
        </div>
      ) : error ? (
        <ErrorAlert
          title="Erreur lors de la récupération des matériaux"
          message={error}
          onRetry={fetchMaterials}
        />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Aucun matériau enregistré"
          message={
            searchTerm || categoryFilter || chantierFilter || onlyLowStock
              ? "Aucun matériau ne correspond à vos filtres de recherche."
              : "Le registre des stocks est vide pour le moment. Ajoutez votre première référence de matériau."
          }
          actionLabel={canManageMaterials ? "Ajouter un matériau" : null}
          actionIcon={Plus}
          onAction={() => {
            setEditingMaterial(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/75 text-2xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Réf & Matériau
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Catégorie
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Niveau Stock
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Prix Unitaire & Valeur
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Chantier / Emplacement
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materials.map((mat) => {
                  const isLow = Number(mat.quantity) <= Number(mat.minStock);
                  const val = (Number(mat.quantity) || 0) * (Number(mat.unitPrice) || 0);

                  return (
                    <tr
                      key={mat._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                              isLow
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            <Boxes className="h-5 w-5" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedMaterial(mat)}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {mat.name}
                            </button>
                            <span className="block font-mono text-2xs font-semibold text-slate-400">
                              {mat.reference}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="default">
                          {getCategoryLabel(mat.category)}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{formatNumber(mat.quantity)}</span>
                            <span className="text-xs font-normal text-slate-500">
                              {getUnitLabel(mat.unit, true)}
                            </span>
                            {isLow && (
                              <Badge
                                variant="rose"
                                dot
                                dotClass="bg-rose-500 animate-pulse"
                                className="ml-1 text-2xs"
                              >
                                Faible
                              </Badge>
                            )}
                          </div>
                          <span className="text-2xs text-slate-400">
                            Min: {formatNumber(mat.minStock)} {getUnitLabel(mat.unit, true)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatMAD(mat.unitPrice)}
                          </p>
                          <p className="text-2xs text-slate-400">
                            Valeur : {formatMAD(val)}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs">
                          {mat.chantier ? (
                            <p className="font-medium text-slate-900 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {mat.chantier.name}
                            </p>
                          ) : (
                            <p className="text-slate-400 italic">Dépôt général</p>
                          )}
                          {mat.storageLocation && (
                            <p className="text-slate-400 text-2xs flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-300" />
                              {mat.storageLocation}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedMaterial(mat)}
                            title="Voir les détails"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {canManageMaterials && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMaterial(mat);
                                setIsFormOpen(true);
                              }}
                              title="Modifier"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {canDeleteMaterials && (
                            <button
                              type="button"
                              onClick={() => setDeletingMaterial(mat)}
                              title="Supprimer"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
            <span>
              Total : <strong className="text-slate-900">{materials.length}</strong> référence(s) affichée(s)
            </span>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <MaterialFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMaterial(null);
        }}
        onSuccess={() => {
          fetchMaterials();
        }}
        material={editingMaterial}
        chantiers={chantiers}
      />

      {/* Detail Modal */}
      <MaterialDetailModal
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
        material={selectedMaterial}
        onEdit={(item) => {
          setEditingMaterial(item);
          setIsFormOpen(true);
        }}
        onDelete={(item) => {
          setDeletingMaterial(item);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingMaterial)}
        onClose={() => {
          setDeletingMaterial(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Supprimer le matériau"
        message={`Êtes-vous certain de vouloir supprimer le matériau "${deletingMaterial?.name}" (Réf: ${deletingMaterial?.reference}) ? Cette action retirera définitivement cette référence du stock.`}
        confirmText="Supprimer définitivement"
      />
    </div>
  );
};

export default MaterialsList;
