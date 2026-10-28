# Guide Complet : Comment Mettre Votre CRM en Ligne avec une Base de Données Cloud

Ce guide vous explique pas à pas, de manière simple et concrète, **comment mettre votre logiciel OpenFlex CRM en ligne** sur Internet afin que vous et vos collaborateurs puissiez y accéder depuis n'importe quel ordinateur, tablette ou smartphone, partout au Sénégal et dans le monde.

---

## 🎯 Architecture d'un CRM en Ligne

Pour que votre application fonctionne 24h/24 en ligne, vous avez besoin de 2 éléments connectés ensemble :
1. **Une Base de Données en Ligne (Cloud Database)** : Elle stocke en toute sécurité vos clients, stocks, devis, factures et paiements Wave/Orange Money. Le standard mondial recommandé est **PostgreSQL** ou **MySQL**.
2. **Le Serveur Web d'Application** : Il exécute le programme Node.js et affiche l'interface sur votre navigateur via une adresse sécurisée en HTTPS (ex: `https://mon-crm-senegal.onrender.com` ou votre nom de domaine `https://crm.mondomaine.sn`).

---

## 🚀 Méthode 1 (Recommandée & Gratuite) : Supabase (Base PostgreSQL) + Render.com (Serveur Web)

C'est la méthode moderne la plus simple, la plus fiable et **100% gratuite** pour démarrer sans carte bancaire obligatoire.

### Étape 1 : Créer votre Base de Données PostgreSQL Gratuite sur Supabase (2 minutes)
1. Rendez-vous sur **[https://supabase.com](https://supabase.com)** et cliquez sur **"Start your project"** (connexion avec Google ou GitHub).
2. Cliquez sur **"New Project"** :
   - Nom du projet : `openflex-crm-senegal`
   - Mot de passe de la base : *Choisissez un mot de passe fort et notez-le*
   - Région : Choisissez **Europe (Frankfurt ou Londres)** (très rapide depuis le Sénégal).
3. Cliquez sur **"Create new project"**. Votre base de données PostgreSQL est prête en 60 secondes !
4. Dans le menu de gauche de Supabase, cliquez sur **"SQL Editor"** :
   - Ouvrez le fichier `database/schema.sql` présent dans votre dossier CRM.
   - Copiez l'intégralité du texte SQL et collez-le dans l'éditeur Supabase.
   - Cliquez sur **"Run"**. Toutes vos 15 tables de gestion (clients, produits, stock, devis, factures, encaissements Wave/OM) sont créées instantanément !
5. Récupérez votre adresse de connexion :
   - Allez dans **Project Settings > Database**.
   - Dans la section **Connection String > URI**, copiez votre lien qui ressemble à :
     `postgresql://postgres:[VOTRE_MOT_DE_PASSE]@db.xxxxxxx.supabase.co:5432/postgres`

---

### Étape 2 : Mettre en ligne l'Application sur Render.com (3 minutes)
1. Créez un compte gratuit sur **[https://render.com](https://render.com)**.
2. Déposez votre projet sur GitHub ou GitLab (privé ou public).
3. Sur Render, cliquez sur **"New +"** puis choisissez **"Web Service"**.
4. Sélectionnez votre dépôt GitHub `CRM` :
   - **Name** : `openflex-crm-senegal`
   - **Environment** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `node server/index.js`
   - **Plan** : `Free` (Gratuit)
5. Dans la section **Environment Variables (Variables d'environnement)**, ajoutez :
   - `DATABASE_URL` = *l'adresse de votre base Supabase copiée à l'étape 1*
   - `NODE_ENV` = `production`
6. Cliquez sur **"Create Web Service"**.
7. En 2 minutes, votre CRM est déployé et Render vous fournit une adresse HTTPS sécurisée :
   👉 **`https://openflex-crm-senegal.onrender.com`**

Vous pouvez désormais vous connecter depuis votre téléphone, créer un devis à Dakar, encaisser par Wave à Touba et vérifier le stock en direct à Thiès !

---

## 🛠️ Méthode 2 : Hébergement sur un Serveur VPS Dédié (OVHcloud, Hostinger, DigitalOcean)

Si vous préférez posséder votre propre serveur VPS dédié au Sénégal ou en France :

### 1. Louez un VPS Ubuntu (à partir de 4€ à 6€ / mois)
- Chez **OVH**, **Hostinger**, **DigitalOcean** ou un hébergeur local au Sénégal.
- Système d'exploitation : **Ubuntu 22.04 LTS ou 24.04 LTS**.

### 2. Connectez-vous en SSH et installez PostgreSQL & Node.js :
```bash
# Mise à jour du serveur
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git postgresql postgresql-contrib

# Installation du gestionnaire de processus PM2 (pour redémarrage auto en cas de coupure)
sudo npm install -g pm2
```

### 3. Créez la base de données PostgreSQL :
```bash
sudo -u postgres psql
CREATE DATABASE openflex_crm;
CREATE USER crm_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_robuste';
GRANT ALL PRIVILEGES ON DATABASE openflex_crm TO crm_user;
\q
```

### 4. Injectez la structure des tables :
```bash
sudo -u postgres psql -d openflex_crm -f /chemin/vers/database/schema.sql
```

### 5. Clonez et lancez l'application avec PM2 :
```bash
git clone https://github.com/votre-compte/crm.git /var/www/crm
cd /var/www/crm
npm install
npm run build

# Démarrage avec PM2
pm2 start server/index.js --name "openflex-crm"
pm2 startup
pm2 save
```

### 6. Associer votre nom de domaine sénégalais (.sn ou .com) avec Nginx et certificat SSL gratuit :
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d crm.votredomaine.sn
```

---

## 📱 Sécurité & Bonnes Pratiques en Production

1. **Sauvegardes quotidiennes automatiques (Automated Backups)** :
   - Dans Supabase ou sur votre VPS, activez la sauvegarde automatique quotidienne.
   - Vous pouvez également cliquer sur **Paramètres > Sauvegardes & Restauration > Télécharger la sauvegarde JSON** dans l'application pour garder une copie sur clé USB ou disque dur externe.
2. **Gestion des Utilisateurs & Rôles** :
   - Ne donnez les accès `admin` qu'à la direction.
   - Les commerciaux ont des accès limités à la prospection, aux devis et aux ventes.
3. **Paiements Mobile Money au Sénégal (Wave / Orange Money)** :
   - Indiquez toujours le numéro de référence de transaction lors de l'enregistrement de l'encaissement pour faciliter les rapprochements comptables de fin de mois.
