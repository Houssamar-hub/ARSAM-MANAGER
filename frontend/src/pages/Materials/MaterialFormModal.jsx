import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from "../../utils/constants.js";
import materialsApi from "../../api/materials.js";

export const MaterialFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  material = null,
  chantiers = [],
}) => {
  const isEdit = Boolean(material && material._id);

  const [formData, setFormData] = useState({
    name: "",
    reference: "",
    category: "",
    unit: "",
    quantity: "0",
    minStock: "0",
    unitPrice: "0",
    storageLocation: "",
    chantier: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || "",
        reference: material.reference || "",
        category: material.category || "",
        unit: material.unit || "",
        quantity: material.quantity !== undefined ? material.quantity.toString() : "0",
        minStock: material.minStock !== undefined ? material.minStock.toString() : "0",
        unitPrice: material.unitPrice !== undefined ? material.unitPrice.toString() : "0",
        storageLocation: material.storageLocation || "",
        chantier:
          typeof material.chantier === "object" && material.chantier !== null
            ? material.chantier._id
            : material.chantier || "",
      });
    } else {
      setFormData({
        name: "",
        reference: "",
        category: "",
        unit: "",
        quantity: "0",
        minStock: "0",
        unitPrice: "0",
        storageLocation: "",
        chantier: "",
      });
    }
    setFieldErrors({});
    setServerError(null);
  }, [material, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "reference" ? value.toUpperCase() : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Le nom du matériau est requis";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Le nom doit comporter au moins 2 caractères";
    } else if (formData.name.trim().length > 150) {
      errors.name = "Le nom ne peut pas dépasser 150 caractères";
    }

    if (!formData.reference.trim()) {
      errors.reference = "La référence unique est requise";
    } else if (formData.reference.trim().length < 2) {
      errors.reference = "La référence doit comporter au moins 2 caractères";
    } else if (formData.reference.trim().length > 50) {
      errors.reference = "La référence ne peut pas dépasser 50 caractères";
    }

    if (!formData.category) {
      errors.category = "Veuillez choisir une catégorie de matériau";
    }

    if (!formData.unit) {
      errors.unit = "Veuillez choisir une unité de mesure";
    }

    if (formData.quantity === "" || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      errors.quantity = "La quantité doit être un nombre positif ou nul";
    }

    if (formData.minStock === "" || isNaN(Number(formData.minStock)) || Number(formData.minStock) < 0) {
      errors.minStock = "Le stock minimal doit être un nombre positif ou nul";
    }

    if (formData.unitPrice === "" || isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0) {
      errors.unitPrice = "Le prix unitaire doit être un nombre positif ou nul";
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
        reference: formData.reference.trim().toUpperCase(),
        category: formData.category,
        unit: formData.unit,
        quantity: Number(formData.quantity),
        minStock: Number(formData.minStock),
        unitPrice: Number(formData.unitPrice),
        storageLocation: formData.storageLocation.trim(),
        chantier: formData.chantier.trim() ? formData.chantier.trim() : null,
      };

      let res;
      if (isEdit) {
        res = await materialsApi.update(material._id, payload);
      } else {
        res = await materialsApi.create(payload);
      }

      if (res?.success) {
        onSuccess?.(res.material);
        onClose();
      } else {
        throw new Error(res?.message || "Une erreur est survenue");
      }
    } catch (err) {
      setServerError(
        err.message || "Erreur lors de l'enregistrement du matériau"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const chantierOptions = chantiers.map((c) => ({
    value: c._id,
    label: `${c.name} (${c.location})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isEdit ? "Modifier le matériau" : "Enregistrer un matériau"}
      subtitle={
        isEdit
          ? `Mise à jour des stocks et informations pour : ${material?.name}`
          : "Ajout d'une nouvelle référence au registre de stock BTP"
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
            {isEdit ? "Enregistrer les modifications" : "Créer le matériau"}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4">
          <ErrorAlert
            title="Erreur d'enregistrement"
            message={serverError}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom du matériau"
            id="mat_name"
            name="name"
            placeholder="ex: Ciment CPJ 45"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            required
          />

          <Input
            label="Référence (Code Unique)"
            id="mat_reference"
            name="reference"
            placeholder="ex: CIM-001"
            value={formData.reference}
            onChange={handleChange}
            error={fieldErrors.reference}
            required
          />

          <Select
            label="Catégorie"
            id="mat_category"
            name="category"
            options={MATERIAL_CATEGORIES}
            value={formData.category}
            onChange={handleChange}
            error={fieldErrors.category}
            required
          />

          <Select
            label="Unité de mesure"
            id="mat_unit"
            name="unit"
            options={MATERIAL_UNITS}
            value={formData.unit}
            onChange={handleChange}
            error={fieldErrors.unit}
            required
          />

          <Input
            label="Quantité en stock"
            id="mat_quantity"
            name="quantity"
            type="number"
            min="0"
            step="any"
            value={formData.quantity}
            onChange={handleChange}
            error={fieldErrors.quantity}
            required
          />

          <Input
            label="Seuil d'alerte (Stock minimum)"
            id="mat_minStock"
            name="minStock"
            type="number"
            min="0"
            step="any"
            value={formData.minStock}
            onChange={handleChange}
            error={fieldErrors.minStock}
            helperText="Alerte déclenchée quand Quantité ≤ Stock minimal"
            required
          />

          <Input
            label="Prix unitaire d'achat (MAD)"
            id="mat_unitPrice"
            name="unitPrice"
            type="number"
            min="0"
            step="any"
            value={formData.unitPrice}
            onChange={handleChange}
            error={fieldErrors.unitPrice}
            required
          />

          <Input
            label="Emplacement de stockage / Dépôt"
            id="mat_storageLocation"
            name="storageLocation"
            placeholder="ex: Entrepôt central - Allée B"
            value={formData.storageLocation}
            onChange={handleChange}
            error={fieldErrors.storageLocation}
          />

          <Select
            label="Chantier affecté (Optionnel)"
            id="mat_chantier"
            name="chantier"
            options={chantierOptions}
            value={formData.chantier}
            onChange={handleChange}
            placeholder="Aucun chantier affecté (Stock général)"
            className="sm:col-span-2"
          />
        </div>
      </form>
    </Modal>
  );
};

export default MaterialFormModal;
