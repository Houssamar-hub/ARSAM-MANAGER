import {
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  Coins,
  Package,
} from "lucide-react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import {
  formatMAD,
  formatNumber,
  formatDate,
  getCategoryLabel,
  getUnitLabel,
} from "../../utils/formatters.js";
import { useAuth } from "../../context/AuthContext.jsx";

export const MaterialDetailModal = ({
  isOpen,
  onClose,
  material,
  onEdit,
  onDelete,
}) => {
  const { canManageMaterials, canDeleteMaterials } = useAuth();

  if (!material) return null;

  const isLowStock = material.quantity <= material.minStock;
  const stockValue = (material.quantity || 0) * (material.unitPrice || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material.name}
      subtitle={`Réf: ${material.reference} • ${getCategoryLabel(material.category)}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {canDeleteMaterials && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  onClose();
                  onDelete?.(material);
                }}
              >
                Supprimer
              </Button>
            )}
            {canManageMaterials && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  onClose();
                  onEdit?.(material);
                }}
              >
                Modifier
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quantity & Stock Health Alert Banner */}
        <div
          className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 ${
            isLowStock
              ? "bg-rose-50/70 border-rose-200 text-rose-950"
              : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isLowStock
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {isLowStock ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Package className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider opacity-75">
                Quantité en stock actuel
              </p>
              <p className="text-2xl font-black">
                {formatNumber(material.quantity)}{" "}
                <span className="text-sm font-semibold opacity-90">
                  {getUnitLabel(material.unit)}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <Badge
              variant={isLowStock ? "rose" : "emerald"}
              dot
              dotClass={isLowStock ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}
              className="text-xs font-bold"
            >
              {isLowStock ? "Alerte : Stock Faible" : "Niveau Stock Conforme"}
            </Badge>
            <p className="text-2xs opacity-75 mt-1 font-medium">
              Seuil minimal configuré : {formatNumber(material.minStock)}{" "}
              {getUnitLabel(material.unit, true)}
            </p>
          </div>
        </div>

        {/* Valuation & Pricing Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Valorisation */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Coins className="w-4 h-4 text-blue-600" />
              <span>Valorisation du stock</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {formatMAD(stockValue)}
            </p>
            <p className="text-2xs text-slate-500 mt-1">
              Prix unitaire : {formatMAD(material.unitPrice)} / {getUnitLabel(material.unit, true)}
            </p>
          </div>

          {/* Location & Chantier */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Chantier & Emplacement</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-800">
                {material.chantier ? (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {material.chantier.name} ({material.chantier.location})
                  </span>
                ) : (
                  <span className="text-slate-500 italic">
                    Dépôt général / Non affecté
                  </span>
                )}
              </p>
              {material.storageLocation && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {material.storageLocation}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Specifications summary */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-slate-400 block font-medium">Référence</span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                {material.reference}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Catégorie</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {getCategoryLabel(material.category)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Enregistré par</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {material.createdBy?.name || "Administrateur"}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Timestamps */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-2xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Créé le : {formatDate(material.createdAt)}
          </span>
          <span>Mis à jour le : {formatDate(material.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
};

export default MaterialDetailModal;
