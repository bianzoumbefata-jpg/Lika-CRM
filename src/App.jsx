import React, { useState, useEffect } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/customers/CustomersView';
import { ProductsView } from './components/products/ProductsView';
import { QuotesView } from './components/quotes/QuotesView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { PipelineKanbanView } from './components/pipeline/PipelineKanbanView';
import { AgendaView } from './components/agenda/AgendaView';
import { InterventionsView } from './components/interventions/InterventionsView';
import { ContractsView } from './components/contracts/ContractsView';
import { SettingsView } from './components/settings/SettingsView';

// Modals triggered globally
import { QuoteEditorModal } from './components/quotes/QuoteEditorModal';
import { InvoiceEditorModal } from './components/invoices/InvoiceEditorModal';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { OpportunityFormModal } from './components/pipeline/OpportunityFormModal';
import { QuotePdfPreview } from './components/quotes/QuotePdfPreview';
import { InvoicePdfPreview } from './components/invoices/InvoicePdfPreview';
import { DeliveryNotePdfPreview } from './components/invoices/DeliveryNotePdfPreview';
import { PaymentReceiptPdfPreview } from './components/invoices/PaymentReceiptPdfPreview';
import { SendDocumentModal } from './components/common/SendDocumentModal';
import { CloneQuoteModal } from './components/quotes/CloneQuoteModal';

function CrmAppContent() {
  const [currentTab, setTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global Quick Action Modals
  const [quoteEditorOpen, setQuoteEditorOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState(null);
  const [quoteInitialCustomer, setQuoteInitialCustomer] = useState(null);

  const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);

  const [opportunityFormOpen, setOpportunityFormOpen] = useState(false);

  // Direct PDF preview modals
  const [pdfQuote, setPdfQuote] = useState(null);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [pdfDeliveryNote, setPdfDeliveryNote] = useState(null);
  const [pdfReceipt, setPdfReceipt] = useState(null);
  const [docToSend, setDocToSend] = useState(null);
  const [quoteToClone, setQuoteToClone] = useState(null);

  const { quotes, invoices, convertQuoteToInvoice } = useCrm();

  // Lien direct vers l'aperçu d'un document : ?apercu=..., ?bl=..., ?recu=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const blRef = params.get('bl');
    if (blRef) {
      const doc =
        invoices.find((item) => item.id === blRef) ||
        quotes.find((item) => item.id === blRef);
      if (doc) return setPdfDeliveryNote(doc);
    }
    const recuRef = params.get('recu');
    if (recuRef) {
      const inv = invoices.find((item) => item.id === recuRef);
      if (inv) return setPdfReceipt(inv);
    }
    const ref = params.get('apercu');
    if (!ref) return;
    const q = quotes.find((item) => item.id === ref);
    if (q) return setPdfQuote(q);
    const inv = invoices.find((item) => item.id === ref);
    if (inv) setPdfInvoice(inv);
  }, [quotes, invoices]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new_quote':
        setQuoteToEdit(null);
        setQuoteInitialCustomer(null);
        setQuoteEditorOpen(true);
        break;
      case 'new_invoice':
        setInvoiceToEdit(null);
        setInvoiceEditorOpen(true);
        break;
      case 'new_customer':
        setCustomerToEdit(null);
        setCustomerFormOpen(true);
        break;
      case 'new_opportunity':
        setOpportunityFormOpen(true);
        break;
      default:
        break;
    }
  };

  const handleCreateQuoteForCustomer = (cust) => {
    setQuoteToEdit(null);
    setQuoteInitialCustomer(cust);
    setQuoteEditorOpen(true);
  };

  const handleOpenQuote = (quoteId) => {
    const q = quotes.find((item) => item.id === quoteId);
    if (q) setPdfQuote(q);
  };

  const handleOpenInvoice = (invoiceId) => {
    const inv = invoices.find((item) => item.id === invoiceId);
    if (inv) setPdfInvoice(inv);
  };

  const handleSelectSearchResult = (type, id) => {
    if (type === 'customers') {
      setTab('customers');
    } else if (type === 'products') {
      setTab('products');
    } else if (type === 'quotes') {
      handleOpenQuote(id);
    } else if (type === 'invoices') {
      handleOpenInvoice(id);
    } else if (type === 'pipeline') {
      setTab('pipeline');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* Sidebar (pleine hauteur) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Navigation */}
        <Navbar
          currentTab={currentTab}
          onNavigate={(tab) => setTab(tab)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenQuickAction={handleQuickAction}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setTab(tab)}
              onOpenQuote={handleOpenQuote}
              onOpenInvoice={handleOpenInvoice}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              onOpenQuote={handleOpenQuote}
              onOpenInvoice={handleOpenInvoice}
              onCreateQuoteForCustomer={handleCreateQuoteForCustomer}
            />
          )}

          {currentTab === 'products' && <ProductsView />}

          {currentTab === 'quotes' && <QuotesView />}

          {currentTab === 'invoices' && <InvoicesView />}

          {currentTab === 'pipeline' && <PipelineKanbanView />}

          {currentTab === 'agenda' && <AgendaView />}

          {currentTab === 'interventions' && <InterventionsView />}

          {currentTab === 'contracts' && <ContractsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Notification Toast */}
      <NotificationToast />

      {/* Global Search Palette (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Global Modals for Quick Actions */}
      <QuoteEditorModal
        isOpen={quoteEditorOpen}
        onClose={() => setQuoteEditorOpen(false)}
        quoteToEdit={quoteToEdit}
        initialCustomer={quoteInitialCustomer}
      />

      <InvoiceEditorModal
        isOpen={invoiceEditorOpen}
        onClose={() => setInvoiceEditorOpen(false)}
        invoiceToEdit={invoiceToEdit}
      />

      <CustomerFormModal
        isOpen={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        customerToEdit={customerToEdit}
      />

      <OpportunityFormModal
        isOpen={opportunityFormOpen}
        onClose={() => setOpportunityFormOpen(false)}
        oppToEdit={null}
      />

      {/* PDF Viewers */}
      {pdfQuote && (
        <QuotePdfPreview
          isOpen={!!pdfQuote}
          onClose={() => setPdfQuote(null)}
          quote={pdfQuote}
          onConvertToInvoice={(id) => convertQuoteToInvoice(id)}
          onOpenSendModal={(q) => setDocToSend({ doc: q, type: 'devis' })}
          onOpenCloneModal={(q) => setQuoteToClone(q)}
        />
      )}

      {/* Global Clone Quote Modal */}
      <CloneQuoteModal
        isOpen={Boolean(quoteToClone)}
        onClose={() => setQuoteToClone(null)}
        sourceQuote={quoteToClone}
        onClonedSuccess={(newQuote) => setPdfQuote(newQuote)}
        onCloneToEditor={(draftQuote) => {
          setQuoteToEdit(draftQuote);
          setQuoteEditorOpen(true);
        }}
      />

      {pdfInvoice && (
        <InvoicePdfPreview
          isOpen={!!pdfInvoice}
          onClose={() => setPdfInvoice(null)}
          invoice={pdfInvoice}
          onOpenSendModal={(inv) => setDocToSend({ doc: inv, type: 'facture' })}
          onOpenDeliveryNote={(inv) => {
            setPdfInvoice(null);
            setPdfDeliveryNote(inv);
          }}
          onOpenPaymentReceipt={(inv) => {
            setPdfInvoice(null);
            setPdfReceipt(inv);
          }}
        />
      )}

      {pdfDeliveryNote && (
        <DeliveryNotePdfPreview
          isOpen={!!pdfDeliveryNote}
          onClose={() => setPdfDeliveryNote(null)}
          document={pdfDeliveryNote}
          onSwitchToInvoice={(inv) => {
            setPdfDeliveryNote(null);
            setPdfInvoice(inv);
          }}
          onSwitchToReceipt={(inv) => {
            setPdfDeliveryNote(null);
            setPdfReceipt(inv);
          }}
        />
      )}

      {pdfReceipt && (
        <PaymentReceiptPdfPreview
          isOpen={!!pdfReceipt}
          onClose={() => setPdfReceipt(null)}
          invoice={pdfReceipt}
          onSwitchToInvoice={(inv) => {
            setPdfReceipt(null);
            setPdfInvoice(inv);
          }}
          onSwitchToDeliveryNote={(inv) => {
            setPdfReceipt(null);
            setPdfDeliveryNote(inv);
          }}
        />
      )}

      {/* Global Send Document Modal */}
      {docToSend && (
        <SendDocumentModal
          isOpen={Boolean(docToSend)}
          onClose={() => setDocToSend(null)}
          document={docToSend.doc}
          documentType={docToSend.type}
          onOpenPdf={(doc) => {
            if (docToSend.type === 'devis') setPdfQuote(doc);
            else setPdfInvoice(doc);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <CrmAppContent />
    </CrmProvider>
  );
}
