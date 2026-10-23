import { AlertTriangle } from "lucide-react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  message = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  isLoading = false,
  variant = "danger",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      maxWidth="max-w-md"
      title={title}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-1">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="mt-0.5">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
