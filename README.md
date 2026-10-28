# OpenFlex CRM & Facturation

Logiciel CRM et ERP de gestion commerciale complet, intuitif et moderne, conçu pour gérer l'intégralité du cycle de vente : **prospect → devis → facture → encaissement → suivi client**.

Inspiré de l'architecture modulaire d'Openflex CRM avec des fonctionnalités avancées de gestion des ventes, devis, multi-contacts, remises personnalisées, multi-tarifs, alertes de rentabilité et tableau de bord en temps réel.

---

## 🚀 Démarrage Rapide

### Option 1 : Double-clic (Recommandé)
Double-cliquez simplement sur le fichier **`demarrer.bat`** à la racine du dossier `f:\Mes Logiciels\CRM`.
Votre navigateur s'ouvrira automatiquement sur **[http://localhost:3001](http://localhost:3001)**.

### Option 2 : En ligne de commande
```bash
# Lancement de l'application complète
node server/index.js
```
Accédez à l'application sur : **http://localhost:3001**

Pour le développement avec rechargement à chaud (Vite) :
```bash
npm run dev
```

---

## 📦 Modules & Fonctionnalités Implémentés

### 1. 👥 Fiches Tiers (Prospects & Clients)
- **Fiches complètes** : Raison sociale, catégorie (PME, Grand Compte, Particulier, VIP, Revendeur), coordonnées téléphoniques, e-mails, adresses et sites web.
- **Identifiants légaux & fiscaux** : SIRET/SIREN, RCS/Greffe, NIF, STAT, Numéro de TVA Intracommunautaire.
- **Carnet de contacts multiples** : Définition d'interlocuteurs par entreprise (Directeur, Responsable Achats, DSI, Comptable) avec désignation du contact principal.
- **Conversion 1-Clic** : Transformation instantanée d'un prospect qualifié en client dès la signature ou sur demande.
- **Conditions commerciales spécifiques** : Remise contractuelle par défaut (%) par client ou groupe.
- **Import / Export CSV** : Export de la base client et import de listings existants.
- **Balance financière du client** : Suivi en direct du total facturé, des règlements reçus et du solde débiteur restant dû.

### 2. 📦 Catalogue Produits & Services
- **Catalogue unifié** : Distinction entre produits matériels (avec suivi de stock) et prestations de services (immatériels, TJM, forfaits).
- **Classification par familles** : Hébergement & Cloud, Logiciels & Licences, Matériel informatique, Prestations de conseil, Formations, Maintenance & Support, Packs & Solutions.
- **Grilles tarifaires multiples** : Prix standard, Particulier (+10%), PME, Revendeur (-15%), VIP (-10%).
- **Contrôle de rentabilité & Prix plancher** : Saisie d'un prix d'achat/revient et d'un prix minimum de vente avec alertes visuelles si une remise fait passer le prix sous le seuil critique.
- **Packs & Kits Tout-en-un** : Composition de packages combinant plusieurs licences, journées d'intégration et prestations.
- **Historique des prix** : Journalisation des évolutions tarifaires avec motifs.
- **Import / Export CSV** du catalogue.

### 3. 📄 Gestion des Devis (Quotes)
- **Numérotation séquentielle automatique** (`DEV-2026-0001`).
- **Éditeur dynamique** : Sélection des articles du catalogue avec auto-remplissage du prix et de la TVA, saisie de lignes personnalisées, application de remises par ligne (%) et remise globale.
- **Cycle de vie des statuts** : Brouillon, Envoyé au client, Accepté / Signé, Refusé, Expiré.
- **Génération & Impression PDF Personnalisée** : Mise en page professionnelle avec coordonnées complètes, identifiants légaux, tableau des prestations, mentions de validité (30 jours), modalités de règlement et encadré "Bon pour accord, date et signature".
- **⚡ Transformation en Facture en 1 Clic** : Dès qu'un devis passe au statut accepté, un bouton d'action immédiat crée la facture officielle correspondante sans ressaisie.

### 4. 🧾 Facturation, Avoirs & Recouvrement
- **Numérotation séquentielle automatique** (`FAC-2026-0001`, `AVO-2026-0001`).
- **Lien avec devis ou saisie directe** : Report automatique des lignes et conditions contractuelles.
- **Gestion des Encaissements Multiples** : Enregistrement de règlements partiels (acomptes) ou soldes totaux avec mode de règlement (Virement, Carte Bancaire, Chèque, Espèces, Mobile Money [MVola, Orange Money, Airtel]).
- **Calcul automatique des impayés** : Suivi du montant réglé et du reste à payer en temps réel.
- **Suivi des statuts** : Brouillon, Validée/Envoyée, Partiellement payée, Payée, En retard (impayé).
- **Factures récurrentes & Abonnements** : Prise en charge des échéances mensuelles, trimestrielles et annuelles.
- **Génération d'Avoirs (Credit Notes)** : Création d'avoirs partiels ou totaux en un clic.
- **Relances automatiques par E-mail** : 3 niveaux d'escalade (Niveau 1 : Courtois, Niveau 2 : Ferme à 48h, Niveau 3 : Mise en demeure avec indemnité forfaitaire légale de 40€) avec journal d'historique des relances.
- **Export Journal des Ventes** : Fichier CSV pour la comptabilité.

### 5. 🎯 Pipeline des Ventes (Kanban & Opportunités)
- **Tableau Kanban interactif** :
  - 1. Qualification (20%)
  - 2. Proposition / Devis envoyé (50%)
  - 3. Négociation (80%)
  - 4. Gagnée / Signée (100%) *(animation festive de confettis !)*
  - 5. Perdue (0%)
- **Calcul du CA Prévisionnel Pondéré (Forecast)** : Estimation statistique des rentrées financières.
- **Déplacement d'étapes en 1 clic** avec réactualisation immédiate de la probabilité de signature.

### 6. 📅 Agenda Partagé, Actions & Historique Client
- **Timeline des interactions** : Appels téléphoniques, e-mails, réunions physiques ou visio, relances de devis/factures, interventions techniques, notes de cadrage.
- **Planification des tâches** avec alertes d'échéances et case à cocher de réalisation.

### 7. 🛠️ Interventions Techniques & Tickets SAV
- **Suivi des interventions** : Statuts (À faire, En cours, Résolue, Annulée) et Priorités (Basse, Moyenne, Haute, Urgente).
- **Affectation de techniciens**, planification de la durée et rédaction du compte-rendu technique d'intervention.

### 8. 📜 Contrats & Abonnements
- **Suivi du MRR (Monthly Recurring Revenue)** : Revenu récurrent mensuel généré.
- **Gestion des échéances et préavis de renouvellement** (30 jours, 60 jours).

### 9. 📊 Tableau de Bord & Analytics
- **Indicateurs financiers clés (KPI)** : CA encaissé, devis en cours d'étude, total des factures impayées, montants en retard critique, taux de transformation devis → commandes.
- **Graphique d'évolution mensuelle** (comparaison Facturé vs Devis).
- **Top 5 des Meilleurs Clients**.
- **Alertes proactives** pour les factures impayées et les devis acceptés en attente de conversion.

### 10. ⚙️ Paramètres & Système
- **Fiche Entreprise & Mentions Légales** : Coordonnées, SIRET, RCS, NIF, STAT, TVA, coordonnées bancaires (IBAN, BIC, Mobile Money), mentions de bas de page.
- **Multi-Devises** : Euro (€), Ariary Malagasy (Ar), Dollar ($), Franc CFA (FCFA), Livre (£) avec configuration de l'emplacement du symbole.
- **TVA personnalisable** : Taux paramétrables (20%, 10%, 5.5%, 0% export).
- **Multi-Utilisateurs & Rôles** : Profils Administrateur, Commercial et Manager avec simulateur de changement d'utilisateur en 1 clic.
- **Sauvegarde & Restauration Intégrale** : Exportation de la base de données au format JSON en 1 clic et restauration instantanée.
- **Réinitialisation du jeu d'essai** : Rétablissement immédiat des données de démonstration.
- **Palette de Commande / Recherche Globale (Ctrl + K)** : Recherche instantanée dans tous les tiers, devis, factures, produits et opportunités.

---

## 📂 Structure du Projet

```
f:\Mes Logiciels\CRM\
├── data/
│   └── crm_database.json        # Base de données persistante JSON
├── server/
│   ├── index.js                 # Serveur API REST Express & serveur de fichiers statiques
│   └── initialData.js           # Données de démonstration réalistes
├── src/
│   ├── context/
│   │   └── CrmContext.jsx       # Contexte d'état global, synchronisation et persistance
│   ├── components/
│   │   ├── common/              # Navbar, Sidebar, Badges, Toast, Recherche Globale
│   │   ├── dashboard/           # Tableau de bord et métriques KPI
│   │   ├── customers/           # Fiches tiers, multi-contacts, conversion prospect
│   │   ├── products/            # Catalogue produits, kits, multi-tarifs
│   │   ├── quotes/              # Devis, éditeur de lignes, prévisualisation/impression PDF
│   │   ├── invoices/            # Factures, encaissements, relances d'impayés, avoirs
│   │   ├── pipeline/            # Pipeline commercial Kanban & opportunités
│   │   ├── agenda/              # Agenda partagé, rappels et actions commerciales
│   │   ├── interventions/       # Tickets SAV, interventions techniques
│   │   ├── contracts/           # Contrats récurrents et abonnements
│   │   └── settings/            # Paramètres société, devises, TVA, utilisateurs, sauvegardes
│   ├── utils/                   # Formateurs de monnaies/dates, exportateur CSV
│   ├── App.jsx                  # Composant racine avec routage d'onglets
│   ├── main.jsx                 # Point d'entrée React
│   └── index.css                # Styles Tailwind CSS et utilitaires d'impression
├── dist/                        # Build de production compilé et optimisé
├── demarrer.bat                 # Script de lancement automatique en 1 clic
└── package.json                 # Dépendances du projet
```

---

## 📱 Utilisation Mobile & Réseau Local
L'application est 100% responsive et s'adapte automatiquement aux smartphones et tablettes.
Pour y accéder depuis votre téléphone ou un autre ordinateur sur le même réseau Wi-Fi local :
1. Lancez `demarrer.bat` sur votre PC.
2. Trouvez l'adresse IP locale de votre machine (ex: `192.168.1.50`).
3. Ouvrez le navigateur de votre téléphone sur : `http://192.168.1.50:3001`.
