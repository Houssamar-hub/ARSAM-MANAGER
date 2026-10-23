import {
  MapPin,
  Calendar,
  Clock,
  FileText,
  Edit2,
  Trash2,
  HardHat,
} from "lucide-react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/common/Button.jsx";
import Badge from "../../components/common/Badge.jsx";
import { formatMAD, formatDate, getStatusInfo } from "../../utils/formatters.js";
import { useAuth } from "../../context/AuthContext.jsx";

export const ChantierDetailModal = ({
  isOpen,
  onClose,
  chantier,
  onEdit,
  onDelete,
}) => {
  const { canManageChantiers, canDeleteChantiers } = useAuth();

  if (!chantier) return null;

  const statusInfo = getStatusInfo(chantier.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chantier.name}
      subtitle={`Détails complets du chantier #${chantier._id}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {canDeleteChantiers && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  onClose();
                  onDelete?.(chantier);
                }}
              >
                Supprimer
              </Button>
            )}
            {canManageChantiers && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  onClose();
                  onEdit?.(chantier);
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
        {/* Status & Key Metrics Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Statut d'exécution
            </span>
            <div className="mt-1">
              <Badge className={statusInfo.badgeClass} dot dotClass={statusInfo.dotClass}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Budget total alloué
            </span>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {formatMAD(chantier.budget)}
            </p>
          </div>

          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Localisation
            </span>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              {chantier.location}
            </p>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Timeline Card */}
          <div className="rounded-xl border border-slate-100 p-4 bg-white shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Planning & Calendrier</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Date de démarrage :</span>
                <span className="font-medium text-slate-900">
                  {formatDate(chantier.startDate)}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Date de livraison :</span>
                <span className="font-medium text-slate-900">
                  {formatDate(chantier.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Manager & Team Card */}
          <div className="rounded-xl border border-slate-100 p-4 bg-white shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <HardHat className="w-4 h-4 text-blue-600" />
              <span>Responsable & Créateur</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Conducteur :</span>
                <span className="font-medium text-slate-900">
                  {chantier.manager?.name || "Non assigné"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Enregistré par :</span>
                <span className="font-medium text-slate-700">
                  {chantier.createdBy?.name || "Système"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Description du projet</span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {chantier.description && chantier.description.trim() ? (
              chantier.description
            ) : (
              <span className="italic text-slate-400">
                Aucune description ou note particulière n'a été enregistrée pour ce chantier.
              </span>
            )}
          </div>
        </div>

        {/* Audit Timestamps */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-2xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Créé le : {formatDate(chantier.createdAt)}
          </span>
          <span>Dernière mise à jour : {formatDate(chantier.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
};

export default ChantierDetailModal;
