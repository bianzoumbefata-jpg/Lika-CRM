import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../../server/initialData.js';

const CrmContext = createContext(null);

export function CrmProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 4000);
  };

  // Fetch initial data from server or localStorage fallback
  useEffect(() => {
    const ensureMarketingDefaults = (payload) => ({
      ...payload,
      leads: payload?.leads?.length ? payload.leads : initialData.leads || [],
      campaigns: payload?.campaigns?.length ? payload.campaigns : initialData.campaigns || [],
      inboxThreads: payload?.inboxThreads?.length
        ? payload.inboxThreads
        : initialData.inboxThreads || [],
      callLogs: payload?.callLogs?.length ? payload.callLogs : initialData.callLogs || [],
      segments: payload?.segments?.length ? payload.segments : initialData.segments || [],
      workflows: payload?.workflows?.length ? payload.workflows : initialData.workflows || [],
      scheduledEmails: payload?.scheduledEmails?.length
        ? payload.scheduledEmails
        : initialData.scheduledEmails || [],
      readNotifications: payload?.readNotifications?.length
        ? payload.readNotifications
        : initialData.readNotifications || [],
    });

    const fetchData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          setData(ensureMarketingDefaults(json));
        } else {
          const local = localStorage.getItem('openflex_crm_data');
          if (local) setData(ensureMarketingDefaults(JSON.parse(local)));
        }
      } catch (err) {
        console.warn('API non disponible, utilisation du stockage local:', err);
        const local = localStorage.getItem('openflex_crm_data');
        if (local) setData(ensureMarketingDefaults(JSON.parse(local)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save changes to backend and localStorage
  const persistData = async (newData) => {
    setData(newData);
    localStorage.setItem('openflex_crm_data', JSON.stringify(newData));

    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (err) {
      console.warn('Sauvegarde serveur échouée, enregistré localement', err);
    }
  };

  // --- CUSTOMERS & PROSPECTS (ADAPTED SENEGAL) ---
  const saveCustomer = (customer) => {
    const isNew = !customer.id;
    const prefix = customer.type === 'prospect' ? 'PROSP' : 'CLI';
    const id = customer.id || `${prefix}-${String(Date.now()).slice(-4)}`;
    const newCust = {
      ...customer,
      id,
      contacts: customer.contacts || [],
      customFields: customer.customFields || [],
      createdAt: customer.createdAt || new Date().toISOString(),
    };

    let updatedList;
    if (isNew) {
      updatedList = [newCust, ...data.customers];
    } else {
      updatedList = data.customers.map((c) => (c.id === id ? newCust : c));
    }

    const updatedData = { ...data, customers: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Fiche tiers créée avec succès' : 'Fiche tiers mise à jour');
    return newCust;
  };

  const convertProspectToClient = (customerId) => {
    const cust = data.customers.find((c) => c.id === customerId);
    if (!cust) return;
    const updated = {
      ...cust,
      type: 'client',
      convertedAt: new Date().toISOString(),
    };
    const updatedData = {
      ...data,
      customers: data.customers.map((c) => (c.id === customerId ? updated : c)),
    };
    persistData(updatedData);
    showToast(`Prospect "${cust.name}" converti en Client officiel ! 🎉`, 'success');
  };

  const deleteCustomer = (id) => {
    const cust = data.customers.find((c) => c.id === id);
    const updatedData = {
      ...data,
      customers: data.customers.filter((c) => c.id !== id),
    };
    persistData(updatedData);
    showToast(`Fiche "${cust?.name || id}" supprimée`, 'info');
  };

  // --- PRODUCTS & STOCK ---
  const saveProduct = (product) => {
    const isNew = !product.id;
    const prefix = product.type === 'service' ? 'SRV' : 'PRD';
    const id = product.id || `${prefix}-${String(Date.now()).slice(-4)}`;

    const salePrice = Number(product.salePriceHT) || 0;
    const costPrice = Number(product.costPriceHT) || 0;

    const newProd = {
      ...product,
      id,
      reference: product.reference || `REF-${String(Date.now()).slice(-4)}`,
      salePriceHT: salePrice,
      costPriceHT: costPrice,
      minSalePriceHT: Number(product.minSalePriceHT) || Math.round(salePrice * 0.8),
      vatRate: Number(product.vatRate) ?? 18,
      stock: product.type === 'produit' ? Number(product.stock) || 0 : null,
      minStockAlert: product.type === 'produit' ? Number(product.minStockAlert) || 2 : null,
      stockLocation: product.stockLocation || 'Dépôt Principal',
      pricingTiers: product.pricingTiers || {
        particulier: Math.round(salePrice * 1.1),
        pme: salePrice,
        revendeur: Math.round(salePrice * 0.85),
        vip: Math.round(salePrice * 0.9),
      },
      priceHistory: product.priceHistory || [],
    };

    let updatedList;
    if (isNew) {
      updatedList = [newProd, ...data.products];
    } else {
      updatedList = data.products.map((p) => (p.id === id ? newProd : p));
    }

    const updatedData = { ...data, products: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Article ajouté au catalogue' : 'Article mis à jour');
    return newProd;
  };

  const deleteProduct = (id) => {
    const updatedData = {
      ...data,
      products: data.products.filter((p) => p.id !== id),
    };
    persistData(updatedData);
    showToast('Article supprimé du catalogue', 'info');
  };

  // --- STOCK MOVEMENTS (ENTRÉES, SORTIES, INVENTAIRE) ---
  const addStockMovement = (movement) => {
    const product = data.products.find((p) => p.id === movement.productId);
    if (!product || product.type !== 'produit') return;

    const qty = Number(movement.quantity) || 0;
    const currentStock = Number(product.stock) || 0;
    let newStock = currentStock;

    if (movement.type === 'entree') {
      newStock = currentStock + qty;
    } else if (movement.type === 'sortie' || movement.type === 'perte') {
      newStock = Math.max(0, currentStock - qty);
    } else if (movement.type === 'ajustement') {
      newStock = qty; // Inventaire direct
    }

    const newMovement = {
      id: `MVT-${Date.now().toString().slice(-5)}`,
      productId: product.id,
      productName: product.name,
      type: movement.type, // 'entree' | 'sortie' | 'ajustement' | 'perte'
      quantity: qty,
      date: movement.date || new Date().toISOString().slice(0, 10),
      reason: movement.reason || 'Mouvement de stock',
      reference: movement.reference || '',
      performedBy: movement.performedBy || data.settings?.currentUser?.name || 'Administrateur',
    };

    const updatedProducts = data.products.map((p) =>
      p.id === product.id ? { ...p, stock: newStock } : p
    );

    const updatedMovements = [newMovement, ...(data.stockMovements || [])];

    const updatedData = {
      ...data,
      products: updatedProducts,
      stockMovements: updatedMovements,
    };

    persistData(updatedData);
    showToast(
      `Stock de "${product.name}" mis à jour : ${newStock} unités (${movement.type === 'entree' ? '+' : '-'}${qty})`,
      'success'
    );
    return newMovement;
  };

  // --- QUOTES (DEVIS) ---
  const getNextQuoteId = () => {
    const year = new Date().getFullYear();
    const maxSeq = (data.quotes || []).reduce((max, q) => {
      const m = String(q.id || '').match(/(\d+)$/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, (data.quotes || []).length);
    return `DEV-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
  };

  const saveQuote = (quote) => {
    const isNew = !quote.id;
    const id = quote.id || getNextQuoteId();

    const newQuote = {
      ...quote,
      id,
      createdAt: quote.createdAt || new Date().toISOString(),
    };

    let updatedList;
    if (isNew) {
      updatedList = [newQuote, ...data.quotes];
    } else {
      updatedList = data.quotes.map((q) => (q.id === id ? newQuote : q));
    }

    const updatedData = { ...data, quotes: updatedList };
    persistData(updatedData);
    showToast(isNew ? `Devis ${id} généré avec succès` : `Devis ${id} mis à jour`);
    return newQuote;
  };

  // Cloner un devis vers un autre client (ou le même)
  const cloneQuote = (sourceQuote, targetCustomerId, options = {}) => {
    if (!sourceQuote) return null;
    const targetCustomer =
      data.customers.find((c) => c.id === targetCustomerId) ||
      { id: sourceQuote.customerId, name: sourceQuote.customerName, defaultDiscount: 0 };

    const today = new Date();
    const valid = new Date();
    valid.setDate(today.getDate() + (data.settings?.financials?.defaultQuoteValidityDays || 30));

    const applyCustDiscount = Boolean(options.applyCustomerDiscount);
    const custDisc = Number(targetCustomer.defaultDiscount) || 0;

    let rawTotalHT = 0;
    let lineDiscounts = 0;
    let vatAmount = 0;

    const clonedItems = (sourceQuote.items || []).map((item, idx) => {
      const q = Number(item.quantity) || 0;
      const pu = Number(item.unitPriceHT) || 0;
      const disc = applyCustDiscount ? custDisc : Number(item.discountPercent) || 0;
      const vat = Number(item.vatRate) ?? 18;

      const baseHT = q * pu;
      const discAmount = (baseHT * disc) / 100;
      const lineHT = Math.max(0, baseHT - discAmount);
      const lineVat = (lineHT * vat) / 100;
      const lineTTC = lineHT + lineVat;

      rawTotalHT += baseHT;
      lineDiscounts += discAmount;
      vatAmount += lineVat;

      return {
        ...item,
        id: `ITM-${Date.now()}-${idx}`,
        discountPercent: disc,
        totalHT: Math.round(lineHT),
        totalTTC: Math.round(lineTTC),
      };
    });

    const globalDisc = Number(sourceQuote.discountGlobalPercent) || 0;
    const netHTBeforeGlobal = rawTotalHT - lineDiscounts;
    const globalDiscAmount = (netHTBeforeGlobal * globalDisc) / 100;
    const finalNetHT = Math.max(0, netHTBeforeGlobal - globalDiscAmount);
    const finalVAT = vatAmount * (1 - globalDisc / 100);
    const finalTTC = finalNetHT + finalVAT;

    const newId = getNextQuoteId();
    const clonedQuote = {
      ...sourceQuote,
      id: newId,
      clonedFromId: sourceQuote.id,
      customerId: targetCustomer.id,
      customerName: targetCustomer.name,
      date: options.date || today.toISOString().slice(0, 10),
      validUntil: options.validUntil || valid.toISOString().slice(0, 10),
      status: 'brouillon',
      convertedToInvoiceId: null,
      items: clonedItems,
      totalHT: Math.round(finalNetHT),
      totalDiscount: Math.round(lineDiscounts + globalDiscAmount),
      totalVAT: Math.round(finalVAT),
      totalTTC: Math.round(finalTTC),
      notes: options.notes !== undefined ? options.notes : sourceQuote.notes,
      createdAt: new Date().toISOString(),
    };

    const updatedData = {
      ...data,
      quotes: [clonedQuote, ...data.quotes],
    };
    persistData(updatedData);
    showToast(
      `Devis ${sourceQuote.id} cloné sous ${newId} pour ${targetCustomer.name}`,
      'success'
    );
    return clonedQuote;
  };

  const deleteQuote = (id) => {
    const updatedData = {
      ...data,
      quotes: data.quotes.filter((q) => q.id !== id),
    };
    persistData(updatedData);
    showToast(`Devis ${id} supprimé`, 'info');
  };

  // 1-Click Conversion: Quote -> Invoice
  const convertQuoteToInvoice = (quoteId) => {
    const quote = data.quotes.find((q) => q.id === quoteId);
    if (!quote) return null;

    const year = new Date().getFullYear();
    const count = data.invoices.filter((i) => i.type === 'facture').length + 1;
    const invoiceId = `FAC-${year}-${String(count).padStart(4, '0')}`;

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + (data.settings?.financials?.defaultPaymentTermsDays || 30));

    const newInvoice = {
      id: invoiceId,
      type: 'facture',
      quoteId: quote.id,
      originalInvoiceId: null,
      customerId: quote.customerId,
      customerName: quote.customerName,
      date: today.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      status: 'envoyee',
      items: quote.items.map((item, idx) => ({
        ...item,
        id: `INV-ITM-${Date.now()}-${idx}`,
      })),
      discountGlobalPercent: quote.discountGlobalPercent || 0,
      totalHT: quote.totalHT,
      totalDiscount: quote.totalDiscount,
      totalVAT: quote.totalVAT,
      totalTTC: quote.totalTTC,
      paidAmount: 0,
      remainingAmount: quote.totalTTC,
      payments: [],
      isRecurring: false,
      recurringFrequency: null,
      reminderHistory: [],
      notes: `Facture issue de la conversion du devis ${quote.id}. ${quote.notes || ''}`,
      terms: quote.terms || 'Paiement à 30 jours date d\'émission par Wave, Orange Money ou Virement CBAO.',
      createdAt: new Date().toISOString(),
    };

    // Update quote status to accepted & mark converted
    const updatedQuotes = data.quotes.map((q) =>
      q.id === quoteId ? { ...q, status: 'accepte', convertedToInvoiceId: invoiceId } : q
    );

    // If customer was prospect, promote to client
    let updatedCustomers = data.customers;
    const cust = data.customers.find((c) => c.id === quote.customerId);
    if (cust && cust.type === 'prospect') {
      updatedCustomers = data.customers.map((c) =>
        c.id === quote.customerId ? { ...c, type: 'client', convertedAt: new Date().toISOString() } : c
      );
    }

    const updatedData = {
      ...data,
      quotes: updatedQuotes,
      invoices: [newInvoice, ...data.invoices],
      customers: updatedCustomers,
    };

    persistData(updatedData);
    showToast(`Devis ${quote.id} transformé en Facture ${invoiceId} ! 🎉`, 'success');
    return newInvoice;
  };

  // --- INVOICES & AVOIRS ---
  const saveInvoice = (invoice) => {
    const isNew = !invoice.id;
    const year = new Date().getFullYear();
    const prefix = invoice.type === 'avoir' ? 'AVO' : 'FAC';
    const count = data.invoices.filter((i) => i.type === invoice.type).length + 1;
    const id = invoice.id || `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const paid = Number(invoice.paidAmount) || 0;
    const total = Number(invoice.totalTTC) || 0;
    let status = invoice.status || 'envoyee';

    if (paid >= total && total > 0) {
      status = 'payee';
    } else if (paid > 0 && paid < total) {
      status = 'partiellement_payee';
    }

    const newInvoice = {
      ...invoice,
      id,
      status,
      remainingAmount: Math.max(0, total - paid),
      payments: invoice.payments || [],
      createdAt: invoice.createdAt || new Date().toISOString(),
    };

    let updatedList;
    if (isNew) {
      updatedList = [newInvoice, ...data.invoices];
    } else {
      updatedList = data.invoices.map((inv) => (inv.id === id ? newInvoice : inv));
    }

    const updatedData = { ...data, invoices: updatedList };
    persistData(updatedData);
    showToast(isNew ? `${invoice.type === 'avoir' ? 'Avoir' : 'Facture'} ${id} créé(e)` : `Facture ${id} mise à jour`);
    return newInvoice;
  };

  const deleteInvoice = (id) => {
    const updatedData = {
      ...data,
      invoices: data.invoices.filter((inv) => inv.id !== id),
    };
    persistData(updatedData);
    showToast(`Facture ${id} supprimée`, 'info');
  };

  // Record an encaissement / payment (with Wave, Orange Money, Free Money support)
  const addPayment = (invoiceId, payment) => {
    const inv = data.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const paymentAmount = Number(payment.amount);
    const newPaidTotal = (Number(inv.paidAmount) || 0) + paymentAmount;
    const newRemaining = Math.max(0, (Number(inv.totalTTC) || 0) - newPaidTotal);

    let newStatus = inv.status;
    if (newRemaining <= 0) {
      newStatus = 'payee';
    } else if (newPaidTotal > 0) {
      newStatus = 'partiellement_payee';
    }

    const newPaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: payment.date || new Date().toISOString().slice(0, 10),
      amount: paymentAmount,
      method: payment.method || 'wave',
      reference: payment.reference || '',
      note: payment.note || '',
    };

    const updatedInvoice = {
      ...inv,
      paidAmount: newPaidTotal,
      remainingAmount: newRemaining,
      status: newStatus,
      stampType:
        newRemaining <= 0 && (!inv.stampType || inv.stampType === 'livre_non_paye')
          ? 'paye'
          : inv.stampType,
      payments: [...(inv.payments || []), newPaymentRecord],
    };

    const updatedData = {
      ...data,
      invoices: data.invoices.map((i) => (i.id === invoiceId ? updatedInvoice : i)),
    };

    persistData(updatedData);
    showToast(`Règlement de ${paymentAmount.toLocaleString('fr-FR')} ${data.settings?.financials?.currencySymbol || 'FCFA'} enregistré via ${payment.method.toUpperCase()} sur ${invoiceId}`, 'success');
  };

  // Apply or change the Digital Stamp (Cachet numérique) on an Invoice
  const updateInvoiceStamp = (invoiceId, stampType) => {
    const inv = data.invoices.find((i) => i.id === invoiceId);
    if (!inv) return null;

    const stampLabels = {
      aucun: 'Aucun cachet',
      paye: 'FACTURE PAYÉE',
      paye_livre: 'PAYÉ & LIVRÉ',
      livre_non_paye: 'LIVRÉ NON PAYÉ',
      paye_non_livre: 'PAYÉ NON LIVRÉ',
    };

    const updatedInvoice = {
      ...inv,
      stampType,
      stampedAt: new Date().toISOString().slice(0, 10),
    };

    const updatedData = {
      ...data,
      invoices: data.invoices.map((i) => (i.id === invoiceId ? updatedInvoice : i)),
    };

    persistData(updatedData);
    showToast(
      stampType === 'aucun'
        ? `Cachet numérique retiré de la facture ${invoiceId}`
        : `Cachet numérique « ${stampLabels[stampType] || stampType} » apposé sur ${invoiceId}`,
      'success'
    );
    return updatedInvoice;
  };

  // Create Credit Note (Avoir) from Invoice
  const createCreditNote = (invoiceId) => {
    const inv = data.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const year = new Date().getFullYear();
    const count = data.invoices.filter((i) => i.type === 'avoir').length + 1;
    const avoirId = `AVO-${year}-${String(count).padStart(4, '0')}`;

    const creditNote = {
      id: avoirId,
      type: 'avoir',
      quoteId: null,
      originalInvoiceId: inv.id,
      customerId: inv.customerId,
      customerName: inv.customerName,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'payee',
      items: inv.items.map((itm) => ({
        ...itm,
        id: `AVO-ITM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        unitPriceHT: -Math.abs(itm.unitPriceHT),
        totalHT: -Math.abs(itm.totalHT),
        totalTTC: -Math.abs(itm.totalTTC),
      })),
      discountGlobalPercent: 0,
      totalHT: -Math.abs(inv.totalHT),
      totalDiscount: 0,
      totalVAT: -Math.abs(inv.totalVAT),
      totalTTC: -Math.abs(inv.totalTTC),
      paidAmount: -Math.abs(inv.totalTTC),
      remainingAmount: 0,
      payments: [
        {
          id: `PAY-AVO-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          amount: -Math.abs(inv.totalTTC),
          method: 'virement',
          reference: `Avoir sur ${inv.id}`,
          note: 'Avoir émis en régularisation',
        },
      ],
      isRecurring: false,
      recurringFrequency: null,
      reminderHistory: [],
      notes: `Avoir de régularisation sur la facture ${inv.id}`,
      terms: 'Déductible des prochaines factures',
      createdAt: new Date().toISOString(),
    };

    const updatedData = {
      ...data,
      invoices: [creditNote, ...data.invoices],
    };

    persistData(updatedData);
    showToast(`Avoir ${avoirId} créé à partir de ${inv.id}`, 'success');
  };

  // Send / Record Payment Reminder
  const sendPaymentReminder = (invoiceId, level = 'courtois', note = '') => {
    const inv = data.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const reminder = {
      id: `REM-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      level,
      sentBy: data.settings?.currentUser?.name || 'Mamadou Lamine Diop',
      note,
    };

    const updatedInvoice = {
      ...inv,
      reminderHistory: [...(inv.reminderHistory || []), reminder],
    };

    const updatedData = {
      ...data,
      invoices: data.invoices.map((i) => (i.id === invoiceId ? updatedInvoice : i)),
    };

    persistData(updatedData);
    showToast(`Relance (${level}) enregistrée pour ${invoiceId}`, 'success');
  };

  // --- OPPORTUNITIES (PIPELINE) ---
  const saveOpportunity = (opp) => {
    const isNew = !opp.id;
    const id = opp.id || `OPP-${String(Date.now()).slice(-4)}`;
    const newOpp = {
      ...opp,
      id,
      value: Number(opp.value) || 0,
      probability: Number(opp.probability) || 20,
    };

    let updatedList;
    if (isNew) {
      updatedList = [newOpp, ...data.opportunities];
    } else {
      updatedList = data.opportunities.map((o) => (o.id === id ? newOpp : o));
    }

    const updatedData = { ...data, opportunities: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Opportunité créée' : 'Opportunité mise à jour');
    return newOpp;
  };

  const updateOpportunityStage = (oppId, newStage) => {
    const probabilities = {
      qualification: 20,
      proposition: 50,
      negociation: 80,
      gagne: 100,
      perdu: 0,
    };

    const updatedList = data.opportunities.map((o) => {
      if (o.id === oppId) {
        return {
          ...o,
          stage: newStage,
          probability: probabilities[newStage] ?? o.probability,
        };
      }
      return o;
    });

    const updatedData = { ...data, opportunities: updatedList };
    persistData(updatedData);
    showToast(`Étape mise à jour : ${newStage}`, 'success');
  };

  const deleteOpportunity = (id) => {
    const updatedData = {
      ...data,
      opportunities: data.opportunities.filter((o) => o.id !== id),
    };
    persistData(updatedData);
    showToast('Opportunité supprimée', 'info');
  };

  // --- ACTIVITIES & AGENDA ---
  const saveActivity = (activity) => {
    const isNew = !activity.id;
    const id = activity.id || `ACT-${String(Date.now()).slice(-4)}`;
    const newAct = {
      ...activity,
      id,
      completed: !!activity.completed,
      createdAt: activity.createdAt || new Date().toISOString(),
    };

    let updatedList;
    if (isNew) {
      updatedList = [newAct, ...data.activities];
    } else {
      updatedList = data.activities.map((a) => (a.id === id ? newAct : a));
    }

    const updatedData = { ...data, activities: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Action ajoutée à l\'agenda' : 'Action mise à jour');
  };

  const toggleActivityCompleted = (id) => {
    const updatedList = data.activities.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a));
    const updatedData = { ...data, activities: updatedList };
    persistData(updatedData);
  };

  const deleteActivity = (id) => {
    const updatedData = {
      ...data,
      activities: data.activities.filter((a) => a.id !== id),
    };
    persistData(updatedData);
    showToast('Action supprimée', 'info');
  };

  // --- INTERVENTIONS ---
  const saveIntervention = (intv) => {
    const isNew = !intv.id;
    const id = intv.id || `INT-${String(Date.now()).slice(-4)}`;
    const newIntv = { ...intv, id };

    let updatedList;
    if (isNew) {
      updatedList = [newIntv, ...data.interventions];
    } else {
      updatedList = data.interventions.map((i) => (i.id === id ? newIntv : i));
    }

    const updatedData = { ...data, interventions: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Intervention planifiée' : 'Intervention mise à jour');
  };

  const deleteIntervention = (id) => {
    const updatedData = {
      ...data,
      interventions: data.interventions.filter((i) => i.id !== id),
    };
    persistData(updatedData);
    showToast('Intervention supprimée', 'info');
  };

  // --- CONTRACTS ---
  const saveContract = (ctr) => {
    const isNew = !ctr.id;
    const id = ctr.id || `CTR-${String(Date.now()).slice(-4)}`;
    const newCtr = { ...ctr, id, amount: Number(ctr.amount) || 0 };

    let updatedList;
    if (isNew) {
      updatedList = [newCtr, ...data.contracts];
    } else {
      updatedList = data.contracts.map((c) => (c.id === id ? newCtr : c));
    }

    const updatedData = { ...data, contracts: updatedList };
    persistData(updatedData);
    showToast(isNew ? 'Contrat enregistré' : 'Contrat mis à jour');
  };

  const deleteContract = (id) => {
    const updatedData = {
      ...data,
      contracts: data.contracts.filter((c) => c.id !== id),
    };
    persistData(updatedData);
    showToast('Contrat supprimé', 'info');
  };

  // --- MARKETING, LEADS & EMAIL CAMPAIGNS ---
  const saveLead = (lead) => {
    const currentLeads = data.leads || [];
    const isNew = !lead.id;
    const id = lead.id || `LEAD-${String(Date.now()).slice(-4)}`;
    const newLead = {
      ...lead,
      id,
      score: Number(lead.score) || 60,
      estimatedBudget: Number(lead.estimatedBudget) || 0,
      createdAt: lead.createdAt || new Date().toISOString().slice(0, 10),
      lastContactDate: lead.lastContactDate || new Date().toISOString().slice(0, 10),
    };

    const updatedList = isNew
      ? [newLead, ...currentLeads]
      : currentLeads.map((l) => (l.id === id ? newLead : l));

    const updatedData = { ...data, leads: updatedList };
    persistData(updatedData);
    showToast(isNew ? `Nouveau lead "${newLead.companyName}" enregistré` : 'Lead mis à jour');
    return newLead;
  };

  const deleteLead = (id) => {
    const updatedData = {
      ...data,
      leads: (data.leads || []).filter((l) => l.id !== id),
    };
    persistData(updatedData);
    showToast('Lead supprimé', 'info');
  };

  // Convert a Marketing Lead directly into an official Prospect (Customers) + Pipeline Opportunity
  const convertLeadToProspect = (leadId) => {
    const currentLeads = data.leads || [];
    const lead = currentLeads.find((l) => l.id === leadId);
    if (!lead) return null;

    const newProspectId = `PROSP-${String(Date.now()).slice(-4)}`;
    const newProspect = {
      id: newProspectId,
      type: 'prospect',
      name: lead.companyName,
      category: 'PME',
      siret: '',
      nif: '',
      stat: 'CSF Dakar',
      rcs: 'SARL',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.city || 'Dakar',
      postalCode: '10000',
      city: lead.city || 'Dakar',
      country: 'Sénégal',
      defaultDiscount: 0,
      notes: `Issu du Lead Marketing ${lead.id} (${lead.source}). Besoin : ${lead.interest || ''}. ${lead.notes || ''}`,
      contacts: [
        {
          id: `CTC-${Date.now()}`,
          name: lead.contactName || 'Contact Principal',
          role: lead.role || 'Direction',
          email: lead.email || '',
          phone: lead.phone || '',
          isPrimary: true,
        },
      ],
      customFields: [],
      createdAt: new Date().toISOString(),
    };

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    const newOpportunity = {
      id: `OPP-${String(Date.now()).slice(-4)}`,
      title: `${lead.interest || 'Projet Équipement & CRM'} — ${lead.companyName}`,
      customerId: newProspectId,
      customerName: lead.companyName,
      value: Number(lead.estimatedBudget) || 1500000,
      stage: 'qualification',
      probability: lead.temperature === 'chaud' ? 50 : 20,
      expectedCloseDate: nextMonth.toISOString().slice(0, 10),
      assignedTo: lead.assignedTo || data.settings?.currentUser?.name || 'Commercial',
      quoteId: null,
      notes: `Opportunité créée automatiquement depuis le Lead ${lead.id} (${lead.source}).`,
    };

    const updatedLeads = currentLeads.map((l) =>
      l.id === leadId
        ? { ...l, status: 'converti', convertedCustomerId: newProspectId }
        : l
    );

    const updatedData = {
      ...data,
      leads: updatedLeads,
      customers: [newProspect, ...(data.customers || [])],
      opportunities: [newOpportunity, ...(data.opportunities || [])],
    };

    persistData(updatedData);
    showToast(
      `Lead "${lead.companyName}" converti en Prospect (${newProspectId}) + Opportunité Pipeline créée !`,
      'success'
    );
    return newProspect;
  };

  const saveCampaign = (campaign) => {
    const currentCampaigns = data.campaigns || [];
    const isNew = !campaign.id;
    const id = campaign.id || `CMP-2026-${String(currentCampaigns.length + 1).padStart(3, '0')}`;
    const newCmp = {
      ...campaign,
      id,
      recipientsCount: Number(campaign.recipientsCount) || 0,
      openRate: Number(campaign.openRate) || 0,
      clickRate: Number(campaign.clickRate) || 0,
      leadsGenerated: Number(campaign.leadsGenerated) || 0,
      revenueGenerated: Number(campaign.revenueGenerated) || 0,
    };

    const updatedList = isNew
      ? [newCmp, ...currentCampaigns]
      : currentCampaigns.map((c) => (c.id === id ? newCmp : c));

    const updatedData = { ...data, campaigns: updatedList };
    persistData(updatedData);
    showToast(isNew ? `Campagne "${newCmp.name}" créée` : 'Campagne mise à jour');
    return newCmp;
  };

  const deleteCampaign = (id) => {
    const updatedData = {
      ...data,
      campaigns: (data.campaigns || []).filter((c) => c.id !== id),
    };
    persistData(updatedData);
    showToast('Campagne supprimée', 'info');
  };

  const launchCampaign = (campaignId, recipientsCountOverride) => {
    const currentCampaigns = data.campaigns || [];
    const cmp = currentCampaigns.find((c) => c.id === campaignId);
    if (!cmp) return;

    const updatedCmp = {
      ...cmp,
      status: 'envoyee',
      sentDate: new Date().toISOString().slice(0, 10),
      recipientsCount: recipientsCountOverride || cmp.recipientsCount || 25,
      openRate: cmp.openRate > 0 ? cmp.openRate : 58,
      clickRate: cmp.clickRate > 0 ? cmp.clickRate : 24,
      leadsGenerated: (Number(cmp.leadsGenerated) || 0) + 2,
    };

    const updatedData = {
      ...data,
      campaigns: currentCampaigns.map((c) => (c.id === campaignId ? updatedCmp : c)),
    };

    persistData(updatedData);
    showToast(
      `Campagne "${cmp.name}" expédiée à ${updatedCmp.recipientsCount} destinataire(s) !`,
      'success'
    );
  };

  // --- OMNICHANNEL INBOX (BOÎTE DE RÉCEPTION HUBSPOT-STYLE) ---
  const replyToThread = (threadId, body, type = 'message') => {
    const threads = data.inboxThreads || [];
    const currentUser = data.settings?.currentUser?.name || 'Mamadou Lamine Diop';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updatedThreads = threads.map((t) => {
      if (t.id !== threadId) return t;
      const newMsg = {
        id: `M-${Date.now()}`,
        sender: 'agent',
        senderName: currentUser,
        timestamp: nowStr,
        type, // 'message' | 'note'
        body,
      };
      return {
        ...t,
        unread: false,
        assignedTo: t.assignedTo || currentUser,
        updatedAt: new Date().toISOString(),
        messages: [...(t.messages || []), newMsg],
      };
    });

    persistData({ ...data, inboxThreads: updatedThreads });
    showToast(
      type === 'note'
        ? 'Note interne ajoutée à la conversation'
        : 'Réponse envoyée et archivée dans le fil',
      'success'
    );
  };

  const toggleThreadStatus = (threadId) => {
    const threads = data.inboxThreads || [];
    const target = threads.find((t) => t.id === threadId);
    if (!target) return;
    const nextStatus = target.status === 'closed' ? 'open' : 'closed';

    const updatedThreads = threads.map((t) =>
      t.id === threadId ? { ...t, status: nextStatus, unread: false } : t
    );

    persistData({ ...data, inboxThreads: updatedThreads });
    showToast(
      nextStatus === 'closed'
        ? `Conversation "${target.companyName}" marquée comme fermée ✓`
        : `Conversation "${target.companyName}" rouverte`,
      'info'
    );
  };

  const assignThread = (threadId, agentName) => {
    const threads = data.inboxThreads || [];
    const updatedThreads = threads.map((t) =>
      t.id === threadId ? { ...t, assignedTo: agentName } : t
    );
    persistData({ ...data, inboxThreads: updatedThreads });
    showToast(
      agentName
        ? `Conversation attribuée à ${agentName}`
        : 'Conversation placée dans « Non attribués »',
      'success'
    );
  };

  const markThreadRead = (threadId) => {
    const threads = data.inboxThreads || [];
    const target = threads.find((t) => t.id === threadId);
    if (!target || !target.unread) return;
    const updatedThreads = threads.map((t) =>
      t.id === threadId ? { ...t, unread: false } : t
    );
    persistData({ ...data, inboxThreads: updatedThreads });
  };

  const createInboxThread = (threadPayload) => {
    const threads = data.inboxThreads || [];
    const currentUser = data.settings?.currentUser?.name || 'Mamadou Lamine Diop';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newThread = {
      id: `MSG-2026-${String(threads.length + 1).padStart(3, '0')}`,
      companyName: threadPayload.companyName || 'Nouveau Contact',
      contactName: threadPayload.contactName || 'Interlocuteur',
      email: threadPayload.email || '',
      phone: threadPayload.phone || '',
      city: threadPayload.city || 'Dakar',
      channel: threadPayload.channel || 'email',
      subject: threadPayload.subject || 'Nouvel échange commercial',
      status: 'open',
      unread: false,
      assignedTo: threadPayload.assignedTo ?? currentUser,
      estimatedValue: Number(threadPayload.estimatedValue) || 0,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `M-${Date.now()}`,
          sender: 'agent',
          senderName: currentUser,
          timestamp: nowStr,
          type: 'message',
          body: threadPayload.initialMessage || 'Bonjour, suite à notre échange...',
        },
      ],
    };

    persistData({ ...data, inboxThreads: [newThread, ...threads] });
    showToast(`Nouvelle conversation ouverte avec ${newThread.companyName}`, 'success');
    return newThread;
  };

  // --- CALL LOGS (JOURNAL D'APPELS CRM) ---
  const saveCallLog = (call) => {
    const logs = data.callLogs || [];
    const isNew = !call.id;
    const id = call.id || `CALL-${String(Date.now()).slice(-4)}`;
    const newCall = {
      ...call,
      id,
      date: call.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
      agent: call.agent || data.settings?.currentUser?.name || 'Mamadou Lamine Diop',
    };

    const updatedLogs = isNew
      ? [newCall, ...logs]
      : logs.map((c) => (c.id === id ? newCall : c));

    persistData({ ...data, callLogs: updatedLogs });
    showToast(isNew ? `Appel avec "${newCall.companyName}" enregistré` : 'Journal d\'appel mis à jour');
    return newCall;
  };

  const deleteCallLog = (id) => {
    persistData({
      ...data,
      callLogs: (data.callLogs || []).filter((c) => c.id !== id),
    });
    showToast('Appel supprimé du journal', 'info');
  };

  // --- SEGMENTS DYNAMIQUES & LISTES MARKETING ---
  const saveSegment = (seg) => {
    const segments = data.segments || [];
    const isNew = !seg.id;
    const id = seg.id || `SEG-${String(Date.now()).slice(-3)}`;
    const newSeg = {
      ...seg,
      id,
      membersCount: Number(seg.membersCount) || 10,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = isNew
      ? [newSeg, ...segments]
      : segments.map((s) => (s.id === id ? newSeg : s));

    persistData({ ...data, segments: updated });
    showToast(isNew ? `Segment "${newSeg.name}" créé` : 'Segment mis à jour');
    return newSeg;
  };

  const deleteSegment = (id) => {
    persistData({
      ...data,
      segments: (data.segments || []).filter((s) => s.id !== id),
    });
    showToast('Segment supprimé', 'info');
  };

  // --- WORKFLOWS & AUTOMATISATION ---
  const saveWorkflow = (wkf) => {
    const workflows = data.workflows || [];
    const isNew = !wkf.id;
    const id = wkf.id || `WKF-${String(Date.now()).slice(-3)}`;
    const newWkf = {
      ...wkf,
      id,
      active: wkf.active !== undefined ? Boolean(wkf.active) : true,
      runsCount: Number(wkf.runsCount) || 0,
      conversionRate: wkf.conversionRate || '35%',
      lastRun: wkf.lastRun || 'Prêt à déclencher',
      actions: Array.isArray(wkf.actions)
        ? wkf.actions
        : String(wkf.actions || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
    };

    const updated = isNew
      ? [newWkf, ...workflows]
      : workflows.map((w) => (w.id === id ? newWkf : w));

    persistData({ ...data, workflows: updated });
    showToast(isNew ? `Workflow "${newWkf.name}" créé et activé` : 'Workflow mis à jour');
    return newWkf;
  };

  const toggleWorkflowActive = (id) => {
    const workflows = data.workflows || [];
    const target = workflows.find((w) => w.id === id);
    if (!target) return;
    const updated = workflows.map((w) =>
      w.id === id ? { ...w, active: !w.active } : w
    );
    persistData({ ...data, workflows: updated });
    showToast(
      !target.active
        ? `Workflow « ${target.name} » activé ⚡`
        : `Workflow « ${target.name} » mis en pause`,
      'info'
    );
  };

  const runWorkflowNow = (id) => {
    const workflows = data.workflows || [];
    const target = workflows.find((w) => w.id === id);
    if (!target) return;
    const updated = workflows.map((w) =>
      w.id === id
        ? {
            ...w,
            active: true,
            runsCount: (Number(w.runsCount) || 0) + 1,
            lastRun: 'À l\'instant (Exécution manuelle)',
          }
        : w
    );
    persistData({ ...data, workflows: updated });
    showToast(`Workflow « ${target.name} » exécuté avec succès ! ⚡`, 'success');
  };

  const deleteWorkflow = (id) => {
    persistData({
      ...data,
      workflows: (data.workflows || []).filter((w) => w.id !== id),
    });
    showToast('Workflow supprimé', 'info');
  };

  // --- SCHEDULED EMAILS & REAL-TIME READ TRACKING (ACCUSE D'OUVERTURE) ---
  const playReadChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {
      // Ignore audio errors
    }
  };

  const scheduleEmail = (payload) => {
    const emails = data.scheduledEmails || [];
    const currentUser = data.settings?.currentUser?.name || 'Mamadou Lamine Diop';
    const isImmediate = Boolean(payload.sendNow);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const id = `SCH-2026-${String(emails.length + 1).padStart(3, '0')}`;
    const trackingId = `TRK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newItem = {
      id,
      trackingId,
      recipientCompany: payload.recipientCompany || 'Destinataire',
      recipientName: payload.recipientName || payload.recipientCompany || 'Contact',
      recipientEmail: payload.recipientEmail || '',
      subject: payload.subject || 'Message OpenFlex Sénégal',
      body: payload.body || '',
      scheduledAt: payload.scheduledAt || nowStr.replace(' ', 'T'),
      sentAt: isImmediate ? nowStr : null,
      status: isImmediate ? 'envoye' : 'programme', // 'programme' | 'envoye' | 'ouvert'
      trackOpen: payload.trackOpen !== false,
      openedAt: null,
      openCount: 0,
      createdBy: currentUser,
    };

    const updatedEmails = [newItem, ...emails];
    persistData({ ...data, scheduledEmails: updatedEmails });

    showToast(
      isImmediate
        ? `📤 E-mail envoyé avec pixel de suivi (${trackingId}) à ${newItem.recipientCompany}`
        : `⏰ E-mail programmé pour le ${newItem.scheduledAt.replace('T', ' à ')} (${newItem.recipientCompany})`,
      'success'
    );
    return newItem;
  };

  const sendScheduledEmailNow = (emailId) => {
    const emails = data.scheduledEmails || [];
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updatedEmails = emails.map((e) =>
      e.id === emailId ? { ...e, status: 'envoye', sentAt: nowStr } : e
    );

    persistData({ ...data, scheduledEmails: updatedEmails });
    showToast(
      `📤 E-mail programmé "${target.subject}" expédié immédiatement à ${target.recipientCompany} !`,
      'success'
    );
  };

  const triggerEmailOpened = (emailId) => {
    const emails = data.scheduledEmails || [];
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newOpenCount = (Number(target.openCount) || 0) + 1;

    const updatedEmails = emails.map((e) =>
      e.id === emailId
        ? {
            ...e,
            status: 'ouvert',
            sentAt: e.sentAt || nowStr,
            openedAt: nowStr,
            openCount: newOpenCount,
          }
        : e
    );

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type: 'email_opened',
      emailId: target.id,
      recipientCompany: target.recipientCompany,
      recipientName: target.recipientName,
      recipientEmail: target.recipientEmail,
      subject: target.subject,
      openedAt: nowStr,
      openCount: newOpenCount,
      unread: true,
    };

    const updatedNotifs = [newNotif, ...(data.readNotifications || [])];

    // Also update matching inbox thread if any
    const updatedThreads = (data.inboxThreads || []).map((t) => {
      if (
        (t.companyName || '').toLowerCase() ===
          (target.recipientCompany || '').toLowerCase() ||
        (t.email && t.email === target.recipientEmail)
      ) {
        return {
          ...t,
          lastReadReceiptAt: nowStr,
        };
      }
      return t;
    });

    persistData({
      ...data,
      scheduledEmails: updatedEmails,
      readNotifications: updatedNotifs,
      inboxThreads: updatedThreads,
    });

    playReadChime();
    showToast(
      `📬 Lecture confirmée : ${target.recipientCompany} (${target.recipientEmail || target.recipientName}) vient d'ouvrir votre e-mail « ${target.subject} » !`,
      'success'
    );
  };

  const deleteScheduledEmail = (emailId) => {
    persistData({
      ...data,
      scheduledEmails: (data.scheduledEmails || []).filter((e) => e.id !== emailId),
    });
    showToast('E-mail programmé supprimé', 'info');
  };

  const markReadNotificationsSeen = () => {
    const notifs = data.readNotifications || [];
    if (!notifs.some((n) => n.unread)) return;
    const updated = notifs.map((n) => ({ ...n, unread: false }));
    persistData({ ...data, readNotifications: updated });
  };

  // Automatic Background Dispatcher for Scheduled Emails
  useEffect(() => {
    const timer = setInterval(() => {
      const list = data.scheduledEmails || [];
      const now = new Date();
      let changed = false;
      let dispatchedItem = null;

      const updated = list.map((item) => {
        if (item.status === 'programme' && item.scheduledAt) {
          const schedDate = new Date(item.scheduledAt);
          if (!isNaN(schedDate.getTime()) && schedDate <= now) {
            changed = true;
            dispatchedItem = item;
            return {
              ...item,
              status: 'envoye',
              sentAt: now.toISOString().replace('T', ' ').slice(0, 16),
            };
          }
        }
        return item;
      });

      if (changed && dispatchedItem) {
        persistData({ ...data, scheduledEmails: updated });
        showToast(
          `⏰ Envoi automatique déclenché : E-mail « ${dispatchedItem.subject} » expédié à ${dispatchedItem.recipientCompany} !`,
          'success'
        );
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [data]);

  // --- SETTINGS & SYSTEM ---
  const updateSettings = (newSettings) => {
    const updatedData = {
      ...data,
      settings: {
        ...data.settings,
        ...newSettings,
      },
    };
    persistData(updatedData);
    showToast('Paramètres de l\'application enregistrés', 'success');
  };

  const switchUser = (userId) => {
    const target = data.settings?.users?.find((u) => u.id === userId);
    if (!target) return;
    const updated = {
      ...data,
      settings: {
        ...data.settings,
        currentUser: {
          ...target,
          avatar: target.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase(),
        },
      },
    };
    persistData(updated);
    showToast(`Connecté en tant que ${target.name} (${target.role})`, 'info');
  };

  const resetDatabase = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setData(initialData);
    localStorage.setItem('openflex_crm_data', JSON.stringify(initialData));
    showToast('Jeu d\'essai réinitialisé aux valeurs du Sénégal (FCFA)', 'success');
  };

  const restoreBackup = (jsonData) => {
    persistData(jsonData);
    showToast('Données restaurées avec succès !', 'success');
  };

  return (
    <CrmContext.Provider
      value={{
        data,
        loading,
        toast,
        showToast,
        currencySymbol: data.settings?.financials?.currencySymbol || 'FCFA',
        currencyCode: data.settings?.financials?.currencyCode || 'XOF',
        currencyPosition: data.settings?.financials?.currencyPosition || 'after',
        // Customers
        customers: data.customers || [],
        saveCustomer,
        convertProspectToClient,
        deleteCustomer,
        // Products & Stock
        products: data.products || [],
        stockMovements: data.stockMovements || [],
        saveProduct,
        deleteProduct,
        addStockMovement,
        // Quotes
        quotes: data.quotes || [],
        saveQuote,
        cloneQuote,
        deleteQuote,
        convertQuoteToInvoice,
        // Invoices
        invoices: data.invoices || [],
        saveInvoice,
        deleteInvoice,
        addPayment,
        updateInvoiceStamp,
        createCreditNote,
        sendPaymentReminder,
        // Pipeline / Opportunities
        opportunities: data.opportunities || [],
        saveOpportunity,
        updateOpportunityStage,
        deleteOpportunity,
        // Activities
        activities: data.activities || [],
        saveActivity,
        toggleActivityCompleted,
        deleteActivity,
        // Interventions
        interventions: data.interventions || [],
        saveIntervention,
        deleteIntervention,
        // Contracts
        contracts: data.contracts || [],
        saveContract,
        deleteContract,
        // Marketing, Leads & Campaigns
        leads: data.leads || [],
        campaigns: data.campaigns || [],
        saveLead,
        deleteLead,
        convertLeadToProspect,
        saveCampaign,
        deleteCampaign,
        launchCampaign,
        // Inbox, Calls, Segments & Workflows (HubSpot-inspired suite)
        inboxThreads: data.inboxThreads || [],
        replyToThread,
        toggleThreadStatus,
        assignThread,
        markThreadRead,
        createInboxThread,
        callLogs: data.callLogs || [],
        saveCallLog,
        deleteCallLog,
        segments: data.segments || [],
        saveSegment,
        deleteSegment,
        workflows: data.workflows || [],
        saveWorkflow,
        toggleWorkflowActive,
        runWorkflowNow,
        deleteWorkflow,
        // Scheduled Emails & Read Tracking Notifications
        scheduledEmails: data.scheduledEmails || [],
        readNotifications: data.readNotifications || [],
        scheduleEmail,
        sendScheduledEmailNow,
        triggerEmailOpened,
        deleteScheduledEmail,
        markReadNotificationsSeen,
        // Settings
        settings: data.settings,
        updateSettings,
        switchUser,
        resetDatabase,
        restoreBackup,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within a CrmProvider');
  return ctx;
}
