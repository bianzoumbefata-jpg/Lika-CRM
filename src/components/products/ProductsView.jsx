import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Layers,
  Tag,
  CheckCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RotateCw,
  Warehouse,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV, parseCSV } from '../../utils/csvExporter';
import { ProductFormModal } from './ProductFormModal';
import { StockMovementModal } from './StockMovementModal';

export function ProductsView() {
  const {
    products,
    stockMovements,
    saveProduct,
    deleteProduct,
    currencySymbol,
    currencyPosition,
  } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'stock' | 'movements'
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all'); // 'all' | 'faible' | 'rupture' | 'dispo'
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [movementDefaultProduct, setMovementDefaultProduct] = useState(null);

  // Extract families
  const families = ['all', ...Array.from(new Set(products.map((p) => p.family).filter(Boolean)))];

  // Stock calculations
  const physicalProducts = products.filter((p) => p.type === 'produit');
  const totalStockItems = physicalProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  // Stock financial valuation
  const totalCostValuation = physicalProducts.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPriceHT) || 0),
    0
  );
  const totalSaleValuation = physicalProducts.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.salePriceHT) || 0),
    0
  );

  // Alerts
  const lowStockProducts = physicalProducts.filter(
    (p) => (p.stock ?? 0) <= (p.minStockAlert ?? 2) && (p.stock ?? 0) > 0
  );
  const outOfStockProducts = physicalProducts.filter((p) => (p.stock ?? 0) <= 0);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (selectedFamily !== 'all' && p.family !== selectedFamily) return false;

    if (p.type === 'produit') {
      const stock = p.stock ?? 0;
      const minAlert = p.minStockAlert ?? 2;
      if (selectedStockFilter === 'faible' && (stock > minAlert || stock <= 0)) return false;
      if (selectedStockFilter === 'rupture' && stock > 0) return false;
      if (selectedStockFilter === 'dispo' && stock <= minAlert) return false;
    } else if (selectedStockFilter !== 'all') {
      return false; // Services don't have stock
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.stockLocation?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const rows = products.map((p) => ({
      Reference: p.reference,
      Nom: p.name,
      Type: p.type,
      Famille: p.family,
      Unite: p.unit,
      Prix_Vente_HT_FCFA: p.salePriceHT,
      Prix_Achat_HT_FCFA: p.costPriceHT,
      Prix_Min_HT_FCFA: p.minSalePriceHT,
      TVA: p.vatRate,
      Stock_Actuel: p.stock ?? '',
      Seuil_Alerte_Stock: p.minStockAlert ?? '',
      Emplacement: p.stockLocation || '',
    }));
    exportToCSV(`openflex-crm-catalogue-stock-${new Date().toISOString().slice(0, 10)}`, rows);
  };

  const handleOpenMovementModal = (product = null) => {
    setMovementDefaultProduct(product);
    setStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catalogue Articles & Stocks</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
              {products.length} articles ({totalStockItems} unités en stock)
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Gestion du catalogue, valorisation des stocks en Franc CFA, alertes de réapprovisionnement et inventaire.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>

          {/* Quick stock movement button */}
          <button
            onClick={() => handleOpenMovementModal()}
            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCw className="w-4 h-4 text-emerald-600" />
            <span>Mouvement de Stock</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setProductModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm shadow-brand-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Stock KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Valeur du Stock (Prix d'Achat)
          </span>
          <div className="text-xl font-black text-slate-900">
            {formatCurrency(totalCostValuation, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Capital immobilisé en stock</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Valeur Marchande (Vente)
          </span>
          <div className="text-xl font-black text-emerald-600">
            {formatCurrency(totalSaleValuation, currencySymbol, currencyPosition)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            Marge brute potentielle : +{formatCurrency(totalSaleValuation - totalCostValuation, currencySymbol, currencyPosition)}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Stock Faible (À Réapprovisionner)
          </span>
          <div className="text-xl font-black text-amber-600">
            {lowStockProducts.length} article(s)
          </div>
          <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
            Sous le seuil d'alerte minimum
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Ruptures de Stock
          </span>
          <div className="text-xl font-black text-rose-600">
            {outOfStockProducts.length} article(s)
          </div>
          <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
            Stock épuisé (0 unité)
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'catalog'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalogue & Prix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stock')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'stock'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Gestion des Stocks & Emplacements ({physicalProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'movements'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Historique des Mouvements ({stockMovements?.length || 0})</span>
        </button>
      </div>

      {/* VIEW 1: CATALOGUE TABLE */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Stock Filter Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setSelectedStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    selectedStockFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tous ({products.length})
                </button>
                <button
                  onClick={() => setSelectedStockFilter('dispo')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    selectedStockFilter === 'dispo' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  En stock normal
                </button>
                <button
                  onClick={() => setSelectedStockFilter('faible')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                    selectedStockFilter === 'faible' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Stock faible ({lowStockProducts.length})</span>
                </button>
                <button
                  onClick={() => setSelectedStockFilter('rupture')}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                    selectedStockFilter === 'rupture' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Rupture ({outOfStockProducts.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher référence, nom, lieu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Families pill tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Familles :
              </span>
              {families.map((fam) => (
                <button
                  key={fam}
                  onClick={() => setSelectedFamily(fam)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    selectedFamily === fam
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {fam === 'all' ? 'Toutes les familles' : fam}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Référence & Désignation</th>
                    <th className="py-3 px-4">Famille</th>
                    <th className="py-3 px-4 text-right">Prix Vente HT</th>
                    <th className="py-3 px-4 text-right">Prix Min HT</th>
                    <th className="py-3 px-4 text-center">TVA</th>
                    <th className="py-3 px-4 text-center">Stock Actuel</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isProduct = p.type === 'produit';
                    const stock = p.stock ?? 0;
                    const minAlert = p.minStockAlert ?? 2;
                    const isLow = isProduct && stock <= minAlert && stock > 0;
                    const isOut = isProduct && stock <= 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 transition group cursor-pointer"
                        onClick={() => {
                          setProductToEdit(p);
                          setProductModalOpen(true);
                        }}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                p.type === 'service'
                                  ? 'bg-purple-50 text-purple-600'
                                  : isOut
                                  ? 'bg-rose-50 text-rose-600'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-brand-600 transition flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.isKit && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                                    Pack
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {p.reference} • Unité : {p.unit}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {p.family}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(p.salePriceHT, currencySymbol, currencyPosition)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-slate-500">
                          {p.minSalePriceHT ? formatCurrency(p.minSalePriceHT, currencySymbol, currencyPosition) : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                          {p.vatRate}%
                        </td>

                        {/* Stock indicator badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isProduct ? (
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {stock} {p.unit}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Seuil min : {minAlert}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Prestation de service</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {isProduct && (
                              <button
                                onClick={() => handleOpenMovementModal(p)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Enregistrer un mouvement de stock"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setProductModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Supprimer ${p.name} du catalogue ?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED STOCK & WAREHOUSES VIEW */}
      {activeSubTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {physicalProducts.map((p) => {
              const stock = p.stock ?? 0;
              const minAlert = p.minStockAlert ?? 2;
              const isLow = stock <= minAlert && stock > 0;
              const isOut = stock <= 0;

              return (
                <div
                  key={p.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {p.reference}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{p.name}</h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isOut
                          ? 'bg-rose-100 text-rose-800'
                          : isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOut ? 'Rupture' : isLow ? 'Faible' : 'En stock'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Stock disponible :</span>
                      <span className="text-2xl font-black text-slate-900">
                        {stock} <span className="text-xs font-normal text-slate-500">{p.unit}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block">Seuil d'alerte :</span>
                      <span className="text-xs font-bold text-slate-700">{minAlert} {p.unit}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.stockLocation || 'Dépôt Principal Dakar'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span>Valorisation Achat :</span>
                      <strong className="text-slate-900 font-mono">
                        {formatCurrency(stock * (p.costPriceHT || 0), currencySymbol, currencyPosition)}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => handleOpenMovementModal(p)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Ajuster / Mouvement</span>
                    </button>
                    <button
                      onClick={() => {
                        setProductToEdit(p);
                        setProductModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: STOCK MOVEMENTS HISTORY */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Journal des Entrées & Sorties de Stock</h3>
            <button
              onClick={() => handleOpenMovementModal()}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Mouvement</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Réf. Mouvement</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4 text-center">Type d'opération</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Motif & Justification</th>
                  <th className="py-3 px-4">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!stockMovements || stockMovements.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Aucun mouvement de stock enregistré pour l'instant.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mvt) => (
                    <tr key={mvt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 font-mono block">{mvt.id}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(mvt.date)}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {mvt.productName}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            mvt.type === 'entree'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : mvt.type === 'sortie'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : mvt.type === 'ajustement'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {mvt.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-sm">
                        <span className={mvt.type === 'entree' ? 'text-emerald-600' : 'text-slate-800'}>
                          {mvt.type === 'entree' ? `+${mvt.quantity}` : mvt.type === 'sortie' ? `-${mvt.quantity}` : mvt.quantity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium">{mvt.reason}</div>
                        {mvt.reference && (
                          <div className="text-[10px] text-slate-400 font-mono">Réf: {mvt.reference}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {mvt.performedBy || 'Admin'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        defaultProduct={movementDefaultProduct}
      />
    </div>
  );
}
