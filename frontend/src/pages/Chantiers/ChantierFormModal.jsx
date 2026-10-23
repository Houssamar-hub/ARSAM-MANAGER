import { useState, useEffect, useMemo } from "react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Textarea from "../../components/common/Textarea.jsx";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import { CHANTIER_STATUSES } from "../../utils/constants.js";
import { formatDateInput } from "../../utils/formatters.js";
import { useAuth } from "../../context/AuthContext.jsx";
import chantiersApi from "../../api/chantiers.js";
import authApi from "../../api/auth.js";

export const ChantierFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  chantier = null, // if null -> create mode, else -> edit mode
  availableManagers = [],
}) => {
  const { user } = useAuth();
  const isEdit = Boolean(chantier && chantier._id);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    budget: "",
    startDate: "",
    endDate: "",
    status: "planned",
    description: "",
    manager: "",
  });

  const [dbManagers, setDbManagers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all active managers & admins from backend
  useEffect(() => {
    let isMounted = true;
    const fetchManagers = async () => {
      try {
        const res = await authApi.getManagers();
        if (isMounted && res?.success && Array.isArray(res.managers)) {
          setDbManagers(res.managers);
        }
      } catch (err) {
        console.warn("Could not fetch managers:", err?.message);
      }
    };

    if (isOpen) {
      fetchManagers();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Combine and deduplicate managers list
  const allManagers = useMemo(() => {
    const map = new Map();

    // Include current logged-in user
    if (user && (user.id || user._id)) {
      const uId = user.id || user._id;
      map.set(uId, {
        _id: uId,
        name: `${user.name} (Vous-même)`,
        email: user.email,
        role: user.role,
      });
    }

    // Include managers from props (extracted from existing chantiers)
    availableManagers.forEach((m) => {
      const mId = m._id || m.id;
      if (mId && !map.has(mId)) {
        map.set(mId, m);
      }
    });

    // Include managers from backend API
    dbManagers.forEach((m) => {
      const mId = m._id || m.id;
      if (mId && !map.has(mId)) {
        map.set(mId, m);
      }
    });

    // Include current chantier manager if editing
    if (
      chantier?.manager &&
      typeof chantier.manager === "object" &&
      chantier.manager._id
    ) {
      if (!map.has(chantier.manager._id)) {
        map.set(chantier.manager._id, chantier.manager);
      }
    }

    return Array.from(map.values());
  }, [user, availableManagers, dbManagers, chantier]);

  const managerOptions = useMemo(() => {
    return allManagers.map((m) => {
      const roleStr = m.role === "admin" ? "Admin" : "Conducteur";
      const emailStr = m.email ? ` • ${m.email}` : "";
      return {
        value: m._id || m.id,
        label: `${m.name} (${roleStr}${emailStr})`,
      };
    });
  }, [allManagers]);

  // Initialize or reset form values
  useEffect(() => {
    if (chantier) {
      setFormData({
        name: chantier.name || "",
        location: chantier.location || "",
        budget: chantier.budget !== undefined ? chantier.budget.toString() : "",
        startDate: formatDateInput(chantier.startDate),
        endDate: formatDateInput(chantier.endDate),
        status: chantier.status || "planned",
        description: chantier.description || "",
        manager:
          typeof chantier.manager === "object" && chantier.manager !== null
            ? chantier.manager._id || chantier.manager.id
            : chantier.manager || user?.id || user?._id || "",
      });
    } else {
      setFormData({
        name: "",
        location: "",
        budget: "",
        startDate: formatDateInput(new Date()),
        endDate: "",
        status: "planned",
        description: "",
        manager: user?.id || user?._id || "",
      });
    }
    setFieldErrors({});
    setServerError(null);
  }, [chantier, isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom du chantier est requis";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Le nom doit comporter au moins 2 caractères";
    } else if (formData.name.trim().length > 150) {
      errors.name = "Le nom ne peut pas dépasser 150 caractères";
    }

    if (!formData.location.trim()) {
      errors.location = "L'emplacement du chantier est requis";
    }

    if (formData.budget === "" || formData.budget === null) {
      errors.budget = "Le budget est requis";
    } else if (isNaN(Number(formData.budget)) || Number(formData.budget) < 0) {
      errors.budget = "Le budget doit être un nombre positif ou nul";
    }

    if (!formData.startDate) {
      errors.startDate = "La date de début est requise";
    }

    if (!formData.endDate) {
      errors.endDate = "La date de fin est requise";
    } else if (
      formData.startDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      errors.endDate =
        "La date de fin doit être postérieure ou égale à la date de début";
    }

    if (!formData.manager) {
      errors.manager = "Veuillez désigner un responsable pour ce chantier";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        budget: Number(formData.budget),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        description: formData.description.trim(),
      };

      if (formData.manager) {
        payload.manager = formData.manager;
      }

      let res;
      if (isEdit) {
        res = await chantiersApi.update(chantier._id, payload);
      } else {
        res = await chantiersApi.create(payload);
      }

      if (res?.success) {
        onSuccess?.(res.chantier);
        onClose();
      } else {
        throw new Error(res?.message || "Une erreur est survenue");
      }
    } catch (err) {
      setServerError(
        err.message || "Erreur lors de l'enregistrement du chantier"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = Object.values(CHANTIER_STATUSES).map((st) => ({
    value: st.key,
    label: st.label,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Modifier le chantier" : "Créer un nouveau chantier"}
      subtitle={
        isEdit
          ? `Mise à jour des informations pour : ${chantier?.name}`
          : "Renseignez les détails du nouveau projet BTP"
      }
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEdit ? "Enregistrer les modifications" : "Créer le chantier"}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4">
          <ErrorAlert
            title="Erreur de validation"
            message={serverError}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom du chantier"
            id="name"
            name="name"
            placeholder="ex: Résidence Les Palmiers"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            required
            className="sm:col-span-2"
          />

          <Input
            label="Localisation / Emplacement"
            id="location"
            name="location"
            placeholder="ex: Casablanca - Ain Diab"
            value={formData.location}
            onChange={handleChange}
            error={fieldErrors.location}
            required
          />

          <Input
            label="Budget prévisionnel (MAD)"
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="1000"
            placeholder="ex: 1500000"
            value={formData.budget}
            onChange={handleChange}
            error={fieldErrors.budget}
            required
          />

          <Input
            label="Date de début des travaux"
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={fieldErrors.startDate}
            required
          />

          <Input
            label="Date de livraison / Fin"
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={fieldErrors.endDate}
            required
          />

          <Select
            label="Statut du projet"
            id="status"
            name="status"
            options={statusOptions}
            value={formData.status}
            onChange={handleChange}
            placeholder=""
            required
          />

          <Select
            label="Conducteur / Responsable du chantier"
            id="manager"
            name="manager"
            options={managerOptions}
            value={formData.manager}
            onChange={handleChange}
            error={fieldErrors.manager}
            placeholder="Sélectionnez un responsable"
            helperText="Le conducteur de travaux ou l'administrateur en charge de ce chantier"
            required
          />
        </div>

        <Textarea
          label="Description du chantier & spécifications"
          id="description"
          name="description"
          rows={3}
          placeholder="Détails du cahier des charges, lots de construction, observations..."
          value={formData.description}
          onChange={handleChange}
          error={fieldErrors.description}
        />
      </form>
    </Modal>
  );
};

export default ChantierFormModal;
