import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import chantiersApi from "../../api/chantiers.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatMAD, formatDate, getStatusInfo } from "../../utils/formatters.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Badge from "../../components/common/Badge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import ChantierFormModal from "./ChantierFormModal.jsx";
import ChantierDetailModal from "./ChantierDetailModal.jsx";

export const ChantiersList = () => {
  const { user, canManageChantiers, canDeleteChantiers } = useAuth();

  const [chantiers, setChantiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChantier, setEditingChantier] = useState(null);
  const [selectedChantier, setSelectedChantier] = useState(null);
  const [deletingChantier, setDeletingChantier] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch from API
  const fetchChantiers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await chantiersApi.getAll(params);
      if (res?.success) {
        setChantiers(res.chantiers || []);
      } else {
        throw new Error(res?.message || "Échec de récupération des chantiers");
      }
    } catch (err) {
      console.error("Error fetching chantiers:", err);
      setError(err.message || "Impossible de charger la liste des chantiers");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChantiers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchChantiers]);

  // Extract known managers for dropdown
  const availableManagers = useMemo(() => {
    const map = new Map();
    if (user?.role === "manager" || user?.role === "admin") {
      map.set(user.id, { _id: user.id, name: user.name, email: user.email });
    }
    chantiers.forEach((c) => {
      if (c.manager && typeof c.manager === "object" && c.manager._id) {
        map.set(c.manager._id, c.manager);
      }
    });
    return Array.from(map.values());
  }, [chantiers, user]);

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deletingChantier) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await chantiersApi.delete(deletingChantier._id);
      if (res?.success) {
        setDeletingChantier(null);
        fetchChantiers();
      } else {
        throw new Error(res?.message || "Erreur lors de la suppression");
      }
    } catch (err) {
      setDeleteError(err.message || "Erreur de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusFilterTabs = [
    { key: "", label: "Tous les chantiers" },
    { key: "in_progress", label: "En cours" },
    { key: "planned", label: "Planifiés" },
    { key: "completed", label: "Terminés" },
    { key: "suspended", label: "Suspendus" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Chantiers de Construction
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestion, suivi et planification des projets BTP de la société
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchChantiers}
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
              onClick={() => {
                setEditingChantier(null);
                setIsFormOpen(true);
              }}
            >
              Nouveau chantier
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="w-full sm:max-w-md">
          <Input
            id="searchChantier"
            name="searchChantier"
            type="search"
            placeholder="Rechercher par nom de chantier ou localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusFilterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delete error notification if any */}
      {deleteError && (
        <ErrorAlert
          title="Impossible de supprimer le chantier"
          message={deleteError}
        />
      )}

      {/* Content Section */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12">
          <LoadingSpinner message="Chargement des chantiers depuis la base de données..." />
        </div>
      ) : error ? (
        <ErrorAlert
          title="Erreur lors de la récupération des chantiers"
          message={error}
          onRetry={fetchChantiers}
        />
      ) : chantiers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun chantier enregistré"
          message={
            searchTerm || statusFilter
              ? "Aucun chantier ne correspond aux critères de recherche actuels."
              : "La base de données ne contient aucun chantier pour le moment. Commencez par créer le premier projet."
          }
          actionLabel={canManageChantiers ? "Créer un chantier" : null}
          actionIcon={Plus}
          onAction={() => {
            setEditingChantier(null);
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
                    Projet & Localisation
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Budget
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Dates prévues
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Conducteur
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {chantiers.map((chantier) => {
                  const statusInfo = getStatusInfo(chantier.status);
                  return (
                    <tr
                      key={chantier._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedChantier(chantier)}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {chantier.name}
                            </button>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {chantier.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          className={statusInfo.badgeClass}
                          dot
                          dotClass={statusInfo.dotClass}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatMAD(chantier.budget)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(chantier.startDate)}</span>
                          <span className="text-slate-400">→</span>
                          <span>{formatDate(chantier.endDate)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <p className="font-medium text-slate-900">
                            {chantier.manager?.name || "Non assigné"}
                          </p>
                          {chantier.manager?.email && (
                            <p className="text-slate-400 text-2xs truncate max-w-[140px]">
                              {chantier.manager.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedChantier(chantier)}
                            title="Voir les détails"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {canManageChantiers && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChantier(chantier);
                                setIsFormOpen(true);
                              }}
                              title="Modifier"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {canDeleteChantiers && (
                            <button
                              type="button"
                              onClick={() => setDeletingChantier(chantier)}
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
              Total : <strong className="text-slate-900">{chantiers.length}</strong> chantier(s) répertorié(s)
            </span>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <ChantierFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChantier(null);
        }}
        onSuccess={() => {
          fetchChantiers();
        }}
        chantier={editingChantier}
        availableManagers={availableManagers}
      />

      {/* Detail Modal */}
      <ChantierDetailModal
        isOpen={Boolean(selectedChantier)}
        onClose={() => setSelectedChantier(null)}
        chantier={selectedChantier}
        onEdit={(item) => {
          setEditingChantier(item);
          setIsFormOpen(true);
        }}
        onDelete={(item) => {
          setDeletingChantier(item);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingChantier)}
        onClose={() => {
          setDeletingChantier(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Supprimer le chantier"
        message={`Êtes-vous certain de vouloir supprimer le chantier "${deletingChantier?.name}" ? Note : La suppression sera bloquée par le serveur si des matériaux lui sont encore affectés.`}
        confirmText="Supprimer définitivement"
      />
    </div>
  );
};

export default ChantiersList;
