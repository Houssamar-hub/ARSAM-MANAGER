# 📑 GUIDE COMPLET : SYSTÈME DE FILTRAGE ET RECHERCHE — ARSAM MANAGER

Ce guide technique explique en détail comment fonctionne le filtrage dans l'architecture **MERN (MongoDB, Express, React, Node.js)** de l'application **ARSAM MANAGER**, et vous fournit la liste complète de tous les filtres existants et ajoutables, avec leur code prêt à l'emploi.

---

## 🎯 1. Vue d'ensemble : Comment fonctionne le filtrage ?

Le filtrage repose sur un flux continu entre le **Frontend** et le **Backend** :

```
[ UTILISATEUR ]
       │  (Tape du texte, sélectionne un statut, choisit une date)
       ▼
[ FRONTEND : React (State) ]
       │  (Stocke l'état dans un useState)
       ▼
[ CLIENT API (URLSearchParams) ]
       │  (Construit l'URL : /api/chantiers?status=in_progress&search=villa)
       ▼
[ BACKEND : Express (req.query) ]
       │  (Extrait les paramètres passés dans la requête)
       ▼
[ MONGOOSE : Query Builder ]
       │  (Construit le filtre MongoDB : { status: 'in_progress', name: { $regex: 'villa', $options: 'i' } })
       ▼
[ BASE DE DONNÉES MONGODB ]
       │  (Renvoie uniquement les enregistrements correspondants)
       ▼
[ RÉPONSE JSON & AFFICHAGE ]
```

---

## 📋 2. Inventaire exhaustif des filtres par module

### Module A : Chantiers (Projets BTP)

| Filtre | Type | Paramètre API | Opérateur MongoDB | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Recherche textuelle** | Chaîne (`string`) | `search=villa` | `$regex` + `$options: "i"` | Recherche par mot-clé dans le nom et la localisation |
| **Statut du projet** | Énumération | `status=in_progress` | `$eq` ou valeur directe | `planned`, `in_progress`, `completed`, `suspended` |
| **Conducteur / Manager** | Identifiant (`ObjectId`) | `manager=67123...` | `$eq` sur champ ObjectId | Chantiers gérés par un conducteur de travaux donné |
| **Budget Minimum** | Nombre (`number`) | `minBudget=500000` | `$gte` (plus grand ou égal) | Projets avec budget supérieur ou égal au montant |
| **Budget Maximum** | Nombre (`number`) | `maxBudget=2000000` | `$lte` (plus petit ou égal) | Projets avec budget inférieur ou égal au montant |
| **Date de début (De/À)** | Date (`ISO / YYYY-MM-DD`) | `startDateFrom`, `startDateTo` | `$gte` / `$lte` sur `startDate` | Chantiers démarrant sur une période précise |
| **Date de fin / Livraison** | Date (`ISO / YYYY-MM-DD`) | `endDateFrom`, `endDateTo` | `$gte` / `$lte` sur `endDate` | Chantiers devant être livrés avant une date |
| **Créé par** | Identifiant (`ObjectId`) | `createdBy=67123...` | `$eq` sur `createdBy` | Chantiers enregistrés par un utilisateur précis |
| **Tri (Sorting)** | Texte | `sortBy=budget&order=desc` | `.sort({ budget: -1 })` | Trier par budget, date de création ou de début |

---

### Module B : Matériaux & Stock

| Filtre | Type | Paramètre API | Opérateur MongoDB | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Recherche textuelle** | Chaîne (`string`) | `search=ciment` | `$regex` + `$options: "i"` | Recherche dans le nom ou la référence (ex: `CPJ-45`) |
| **Catégorie** | Énumération | `category=cement` | `$eq` sur `category` | `cement`, `iron`, `sand`, `gravel`, `wood`, `paint`, etc. |
| **Affectation Chantier** | Identifiant (`ObjectId`) | `chantier=67123...` | `$eq` sur `chantier` | Matériaux alloués à un chantier ou stock général |
| **Stock faible / Alerte** | Booléen (`boolean`) | `lowStock=true` | `$expr: { $lte: ["$quantity", "$minStock"] }` | Articles dont la quantité est sous le seuil d'alerte |
| **Rupture totale** | Booléen (`boolean`) | `outOfStock=true` | `quantity: 0` | Matériaux dont le stock est strictement épuisé |
| **Emplacement / Dépôt** | Texte | `storageLocation=DepotA` | `$regex` ou `$eq` | Filtrer par magasin, dépôt ou zone de stockage |
| **Unité de mesure** | Énumération | `unit=ton` | `$eq` sur `unit` | `piece`, `kg`, `ton`, `bag`, `m3`, `liter`, `meter` |
| **Prix unitaire (Min/Max)** | Nombre (`number`) | `minPrice=100&maxPrice=500` | `$gte` / `$lte` sur `unitPrice` | Tranches de tarification d'achat |
| **Valeur du stock (Min/Max)**| Nombre (`number`) | `minValue=&maxValue=` | Calcul `$expr` ou agrégation | Filtrer sur la valorisation totale de la référence |

---

## 🛠️ 3. Guide de mise en œuvre : Côté Backend (Node.js & Express)

### Comment construire le contrôleur backend avec filtres multiples ?

Voici la structure de référence pour le fichier `server/controllers/chantierController.js` :

```javascript
export const getChantiers = async (req, res) => {
  try {
    const {
      status,
      search,
      manager,
      minBudget,
      maxBudget,
      startDateFrom,
      startDateTo,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // 1. Filtre par statut exact
    if (status) {
      filter.status = status;
    }

    // 2. Filtre par conducteur de travaux (Manager)
    if (manager && mongoose.isValidObjectId(manager)) {
      filter.manager = manager;
    }

    // 3. Filtre par tranche de budget ($gte, $lte)
    if (minBudget !== undefined || maxBudget !== undefined) {
      filter.budget = {};
      if (minBudget !== undefined && minBudget !== "") {
        filter.budget.$gte = Number(minBudget);
      }
      if (maxBudget !== undefined && maxBudget !== "") {
        filter.budget.$lte = Number(maxBudget);
      }
    }

    // 4. Filtre par période de dates
    if (startDateFrom || startDateTo) {
      filter.startDate = {};
      if (startDateFrom) {
        filter.startDate.$gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        filter.startDate.$lte = new Date(startDateTo);
      }
    }

    // 5. Recherche textuelle (insensible à la casse) sur Nom OU Localisation
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // 6. Tri dynamique et exécution
    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const chantiers = await Chantier.find(filter)
      .populate("manager", "name email role")
      .populate("createdBy", "name email")
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: chantiers.length,
      chantiers,
    });
  } catch (error) {
    console.error("Erreur filtrage chantiers :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
```

---

## 💻 4. Guide de mise en œuvre : Côté Frontend (React)

### A. Comment envoyer les paramètres dans l'API (`frontend/src/api/client.js`)

Le client HTTP utilise `URLSearchParams` pour ne pas envoyer les paramètres vides :

```javascript
get: (endpoint, params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      searchParams.append(key, val);
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return request(url, { method: "GET" });
}
```

### B. Gestion des états de filtres dans un composant React

```jsx
import { useState, useEffect, useCallback } from "react";
import chantiersApi from "../api/chantiers";

export const ChantiersList = () => {
  // États individuels de chaque filtre
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [chantiers, setChantiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction de chargement avec débouncing
  const loadChantiers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        search: searchTerm,
        status: statusFilter,
        manager: managerFilter,
        minBudget: minBudget,
        maxBudget: maxBudget,
      };

      const res = await chantiersApi.getAll(params);
      if (res?.success) {
        setChantiers(res.chantiers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, managerFilter, minBudget, maxBudget]);

  // Déclencheur automatique lors d'un changement de filtre (300ms de délai)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadChantiers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadChantiers]);

  // Bouton pour réinitialiser tous les filtres à zéro
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setManagerFilter("");
    setMinBudget("");
    setMaxBudget("");
  };

  return (
    <div>
      {/* Barre de filtres visuelle */}
      <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="in_progress">En cours</option>
          <option value="planned">Planifié</option>
          <option value="completed">Terminé</option>
          <option value="suspended">Suspendu</option>
        </select>

        <button onClick={resetFilters}>Réinitialiser</button>
      </div>

      {/* Affichage des données */}
      {/* ... */}
    </div>
  );
};
```

---

## ⚡ 5. Filtrage Côté Serveur (Backend) vs Côté Client (Frontend)

| Critère | Filtrage Côté Serveur (Recommandé) | Filtrage Côté Client |
| :--- | :--- | :--- |
| **Comment ça marche ?** | Mongoose filtre dans MongoDB avec `Model.find(query)` | Le backend renvoie tout, React filtre avec `.filter()` |
| **Volume de données** | Idéal pour des milliers de lignes (performant) | Devient lent au-delà de 200 lignes |
| **Consommation réseau** | Ne transfère que les résultats correspondants | Transfère toute la base de données inutilement |
| **Cas d'usage idéal** | Recherche générale, pagination, filtres complexes | Filtre instantané sur un petit tableau déjà chargé |

---

## 💡 6. Guide d'impression PDF

Pour transformer ce guide en document **PDF** propre et imprimable :
1. Ouvrez le fichier **`GUIDE_FILTRAGE_ARSAM.html`** présent à la racine du projet dans Google Chrome, Microsoft Edge ou Brave.
2. Appuyez sur les touches **`Ctrl + P`** (ou faites un clic droit puis *Imprimer*).
3. Dans la section Destination, sélectionnez **« Enregistrer au format PDF »**.
4. Cliquez sur **Enregistrer**.
