-- ==============================================================================
-- OPENFLEX CRM & FACTURATION - SCHEMA DE BASE DE DONNEES POSTGRESQL / SUPABASE
-- Adapte pour le Senegal & UEMOA (Franc CFA - XOF - TVA 18%)
-- ==============================================================================

-- 0. TABLE DE SYNCHRONISATION CLOUD TEMPS REEL (SUPABASE DIRECT SYNC)
CREATE TABLE IF NOT EXISTS crm_cloud_state (
    id TEXT PRIMARY KEY DEFAULT 'OPENFLEX-MAIN',
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE crm_cloud_state ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'crm_cloud_state' AND policyname = 'Allow full access to crm_cloud_state'
    ) THEN
        CREATE POLICY "Allow full access to crm_cloud_state"
        ON crm_cloud_state FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 1. TABLE DES ENTREPRISES / SOCIETE
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'COMPANY-001',
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    ninea VARCHAR(100), -- NINEA Sénégal
    rccm VARCHAR(100),  -- RCCM Sénégal
    cofi VARCHAR(100),  -- Centre des Services Fiscaux
    vat_number VARCHAR(100),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dakar',
    region VARCHAR(100) DEFAULT 'Dakar',
    country VARCHAR(100) DEFAULT 'Sénégal',
    phone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    bank_name VARCHAR(255),
    iban VARCHAR(100),
    bic VARCHAR(50),
    mobile_money TEXT, -- Comptes Wave / Orange Money / Free Money
    wave_number VARCHAR(50) DEFAULT '+221 77 650 80 90',
    orange_money_number VARCHAR(50) DEFAULT '+221 77 650 80 90',
    wave_qr_image TEXT,
    orange_money_qr_image TEXT,
    show_qr_codes BOOLEAN DEFAULT TRUE,
    footer_terms TEXT,
    invoice_notes TEXT,
    quote_notes TEXT,
    currency_symbol VARCHAR(20) DEFAULT 'FCFA',
    default_vat_rate NUMERIC(5,2) DEFAULT 18.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLE DES UTILISATEURS & EQUIPE COMMERCIALE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'commercial', -- 'admin', 'commercial', 'manager'
    status VARCHAR(50) DEFAULT 'actif',
    avatar VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLE DES TIERS (PROSPECTS & CLIENTS)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'prospect', -- 'prospect', 'client'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'PME', -- 'PME', 'Grand Compte', 'Particulier', 'VIP'
    ninea VARCHAR(100),
    rccm VARCHAR(100),
    cofi VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    postal_code VARCHAR(20) DEFAULT '10200',
    city VARCHAR(100) DEFAULT 'Dakar',
    region VARCHAR(100) DEFAULT 'Dakar',
    country VARCHAR(100) DEFAULT 'Sénégal',
    default_discount NUMERIC(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    converted_at TIMESTAMP WITH TIME ZONE
);

-- 4. TABLE DES CONTACTS MULTIPLES
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLE DU CATALOGUE ARTICLES (PRODUITS & SERVICES)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'produit', -- 'produit' (matériel), 'service' (immatériel)
    reference VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    family VARCHAR(100) DEFAULT 'Matériel informatique',
    unit VARCHAR(50) DEFAULT 'unité',
    sale_price_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- en FCFA
    cost_price_ht NUMERIC(15,2) DEFAULT 0.00,
    min_sale_price_ht NUMERIC(15,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 18.00,
    stock NUMERIC(10,2) DEFAULT 0, -- Stock actuel
    min_stock_alert NUMERIC(10,2) DEFAULT 2, -- Seuil d'alerte réapprovisionnement
    stock_location VARCHAR(255) DEFAULT 'Dépôt Principal Dakar',
    is_kit BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLE DES MOUVEMENTS DE STOCK & INVENTAIRE
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'entree', 'sortie', 'ajustement', 'perte'
    quantity NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255),
    reference VARCHAR(100), -- N° Bon de livraison, Facture, etc.
    performed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLE DES DEVIS (QUOTES)
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(50) PRIMARY KEY, -- ex: DEV-2026-0001
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'brouillon', -- 'brouillon', 'envoye', 'accepte', 'refuse', 'expire'
    discount_global_percent NUMERIC(5,2) DEFAULT 0.00,
    total_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(15,2) DEFAULT 0.00,
    total_vat NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_ttc NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    terms TEXT,
    converted_to_invoice_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLE DES LIGNES DE DEVIS
CREATE TABLE IF NOT EXISTS quote_items (
    id VARCHAR(50) PRIMARY KEY,
    quote_id VARCHAR(50) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id),
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) DEFAULT 'unité',
    unit_price_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 18.00,
    total_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_ttc NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- 9. TABLE DES FACTURES & AVOIRS
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY, -- ex: FAC-2026-0001, AVO-2026-0001
    type VARCHAR(50) NOT NULL DEFAULT 'facture', -- 'facture', 'avoir'
    quote_id VARCHAR(50) REFERENCES quotes(id),
    original_invoice_id VARCHAR(50),
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'envoyee', -- 'brouillon', 'envoyee', 'partiellement_payee', 'payee', 'en_retard'
    discount_global_percent NUMERIC(5,2) DEFAULT 0.00,
    total_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(15,2) DEFAULT 0.00,
    total_vat NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_ttc NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15,2) DEFAULT 0.00,
    remaining_amount NUMERIC(15,2) DEFAULT 0.00,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(50), -- 'mensuel', 'trimestriel', 'annuel'
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABLE DES LIGNES DE FACTURES
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id),
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50) DEFAULT 'unité',
    unit_price_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    vat_rate NUMERIC(5,2) DEFAULT 18.00,
    total_ht NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_ttc NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- 11. TABLE DES ENCAISSEMENTS & REGLEMENTS (WAVE, ORANGE MONEY, CBAO...)
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL, -- en FCFA
    method VARCHAR(50) NOT NULL DEFAULT 'wave', -- 'wave', 'orange_money', 'free_money', 'virement', 'cheque', 'especes'
    reference VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. TABLE DU PIPELINE COMMERCIAL (KANBAN & OPPORTUNITES)
CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    value NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- en FCFA
    stage VARCHAR(50) DEFAULT 'qualification', -- 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'
    probability NUMERIC(5,2) DEFAULT 20.00,
    expected_close_date DATE,
    assigned_to VARCHAR(255),
    quote_id VARCHAR(50) REFERENCES quotes(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. TABLE DES ACTIONS & AGENDA
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id),
    customer_name VARCHAR(255),
    type VARCHAR(50) DEFAULT 'appel', -- 'appel', 'email', 'reunion', 'relance', 'intervention', 'note'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. TABLE DES INTERVENTIONS TECHNIQUES & SAV
CREATE TABLE IF NOT EXISTS interventions (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'a_faire', -- 'a_faire', 'en_cours', 'resolu', 'annule'
    priority VARCHAR(50) DEFAULT 'moyenne', -- 'basse', 'moyenne', 'haute', 'urgente'
    scheduled_date DATE,
    duration_hours NUMERIC(5,2) DEFAULT 2.0,
    technician VARCHAR(255),
    report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. TABLE DES CONTRATS & ABONNEMENTS (MRR)
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    billing_frequency VARCHAR(50) DEFAULT 'mensuel', -- 'mensuel', 'trimestriel', 'annuel'
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- en FCFA
    status VARCHAR(50) DEFAULT 'actif', -- 'actif', 'expire', 'resilie'
    renewal_notice_days INT DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES POUR ACCELERER LES RECHERCHES
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
