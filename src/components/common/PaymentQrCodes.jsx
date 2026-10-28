import React, { useState } from 'react';
import { Smartphone, Check, Copy, QrCode as QrIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function PaymentQrCodes({
  documentType = 'facture',
  documentId = '',
  amount = 0,
  company = {},
  currencySymbol = 'FCFA',
}) {
  const [copiedWave, setCopiedWave] = useState(false);
  const [copiedOm, setCopiedOm] = useState(false);
  const [waveImgError, setWaveImgError] = useState(false);
  const [omImgError, setOmImgError] = useState(false);

  // If user disabled QR codes in settings
  if (company.showQrCodesOnDocuments === false) {
    return null;
  }

  const wavePhone = company.waveNumber || company.mobile || '+221 77 650 80 90';
  const omPhone = company.orangeMoneyNumber || company.mobile || '+221 77 650 80 90';
  const merchantName = company.name || 'OpenFlex Sénégal';

  const waveQrCustom = company.waveQrImage || '';
  const omQrCustom = company.orangeMoneyQrImage || '';

  // Payment payload data for QR code scanning
  const docLabel = documentType === 'devis' ? 'Devis' : 'Facture';
  const waveQrData = `Wave Sénégal | ${merchantName} | ${docLabel}: ${documentId} | Montant: ${amount} FCFA | Tél: ${wavePhone}`;
  const omQrData = `Orange Money | ${merchantName} | ${docLabel}: ${documentId} | Montant: ${amount} FCFA | Tél: ${omPhone}`;

  // Compact size for fast loading and crisp display
  const waveDynamicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(waveQrData)}`;
  const omDynamicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(omQrData)}`;

  const handleCopyWave = (e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(wavePhone.replace(/\s+/g, ''));
    setCopiedWave(true);
    setTimeout(() => setCopiedWave(false), 2000);
  };

  const handleCopyOm = (e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(omPhone.replace(/\s+/g, ''));
    setCopiedOm(true);
    setTimeout(() => setCopiedOm(false), 2000);
  };

  return (
    <div className="payment-qr-section border border-slate-200 rounded-sm p-2 bg-slate-50/70 space-y-1.5 text-[10px]">
      {/* Compact Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <QrIcon className="w-2.5 h-2.5" />
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-800">
            Paiement par Mobile Money Sénégal (Scannez le Code QR)
          </span>
        </div>

        {amount > 0 && (
          <span className="text-[10px] font-bold text-slate-900 font-mono">
            À régler : {formatCurrency(amount, currencySymbol, 'after')}
          </span>
        )}
      </div>

      {/* Grid with 2 Compact Horizontal Cards (Wave & Orange Money) */}
      <div className="grid grid-cols-2 gap-2">
        {/* ================= WAVE SÉNÉGAL (COMPACT) ================= */}
        <div className="bg-white rounded-sm border border-[#1dc4fe]/50 p-1.5 flex items-center gap-2 hover:border-[#1dc4fe] transition">
          {/* Reduced QR Code container: 15mm x 15mm (~56px) */}
          <div className="relative w-[15mm] h-[15mm] shrink-0 bg-white p-0.5 rounded-sm border border-slate-200 flex items-center justify-center overflow-hidden">
            {waveQrCustom ? (
              <img
                src={waveQrCustom}
                alt="Code QR Wave"
                className="w-full h-full object-contain rounded"
              />
            ) : !waveImgError ? (
              <img
                src={waveDynamicUrl}
                alt={`QR Wave ${documentId}`}
                className="w-full h-full object-contain rounded"
                onError={() => setWaveImgError(true)}
              />
            ) : (
              <VectorQrFallback
                color="#0084c7"
                badge="W"
              />
            )}

            {/* Small center badge if dynamic */}
            {!waveQrCustom && !waveImgError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-[#1dc4fe] border border-white shadow-xs flex items-center justify-center">
                  <span className="text-[7px] font-black text-white">W</span>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#007cb8] tracking-tight">WAVE SÉNÉGAL</span>
              <span className="text-[8px] font-bold bg-[#1dc4fe]/15 text-[#007cb8] px-1.5 py-0.2 rounded uppercase">
                Sans frais
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono font-bold text-slate-800">{wavePhone}</span>
              <button
                type="button"
                onClick={handleCopyWave}
                className="no-print p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Copier le numéro Wave"
              >
                {copiedWave ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <p className="text-[9.5px] text-slate-500 leading-tight">
              Scannez avec l'app Wave pour régler
            </p>

            <div className="text-[9.5px] text-slate-400 font-mono">
              Réf : <strong className="text-slate-700">{documentId}</strong>
            </div>
          </div>
        </div>

        {/* ================= ORANGE MONEY SÉNÉGAL (COMPACT) ================= */}
        <div className="bg-white rounded-sm border border-[#ff7900]/50 p-1.5 flex items-center gap-2 hover:border-[#ff7900] transition">
          {/* Reduced QR Code container: 15mm x 15mm (~56px) */}
          <div className="relative w-[15mm] h-[15mm] shrink-0 bg-white p-0.5 rounded-sm border border-slate-200 flex items-center justify-center overflow-hidden">
            {omQrCustom ? (
              <img
                src={omQrCustom}
                alt="Code QR Orange Money"
                className="w-full h-full object-contain rounded"
              />
            ) : !omImgError ? (
              <img
                src={omDynamicUrl}
                alt={`QR Orange Money ${documentId}`}
                className="w-full h-full object-contain rounded"
                onError={() => setOmImgError(true)}
              />
            ) : (
              <VectorQrFallback
                color="#e05d00"
                badge="OM"
              />
            )}

            {/* Small center badge if dynamic */}
            {!omQrCustom && !omImgError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-[#ff7900] border border-white shadow-xs flex items-center justify-center">
                  <span className="text-[7px] font-black text-white">OM</span>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#c04c00] tracking-tight">ORANGE MONEY</span>
              <span className="text-[8px] font-bold bg-[#ff7900]/15 text-[#c04c00] px-1.5 py-0.2 rounded uppercase">
                #144# / App
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono font-bold text-slate-800">{omPhone}</span>
              <button
                type="button"
                onClick={handleCopyOm}
                className="no-print p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Copier le numéro Orange Money"
              >
                {copiedOm ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <p className="text-[9.5px] text-slate-500 leading-tight">
              Scannez via Max it ou tapez #144#
            </p>

            <div className="text-[9.5px] text-slate-400 font-mono">
              Réf : <strong className="text-slate-700">{documentId}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-400">
        Précisez la référence <strong className="font-mono text-slate-600">{documentId}</strong> en motif de votre virement Mobile Money.
      </div>
    </div>
  );
}

/**
 * High-fidelity Vector Fallback QR representation
 * Rendered when offline or if dynamic image service cannot be reached.
 */
function VectorQrFallback({ color = '#0f172a', badge = 'QR' }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-0.5 bg-white select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full" fill={color}>
        {/* Top-Left Finder */}
        <rect x="5" y="5" width="28" height="28" rx="3" fill={color} />
        <rect x="9" y="9" width="20" height="20" rx="1.5" fill="white" />
        <rect x="13" y="13" width="12" height="12" fill={color} />

        {/* Top-Right Finder */}
        <rect x="67" y="5" width="28" height="28" rx="3" fill={color} />
        <rect x="71" y="9" width="20" height="20" rx="1.5" fill="white" />
        <rect x="75" y="13" width="12" height="12" fill={color} />

        {/* Bottom-Left Finder */}
        <rect x="5" y="67" width="28" height="28" rx="3" fill={color} />
        <rect x="9" y="71" width="20" height="20" rx="1.5" fill="white" />
        <rect x="13" y="75" width="12" height="12" fill={color} />

        {/* Timing Lines */}
        <rect x="37" y="8" width="4" height="4" />
        <rect x="45" y="8" width="4" height="4" />
        <rect x="53" y="8" width="4" height="4" />
        <rect x="8" y="37" width="4" height="4" />
        <rect x="8" y="45" width="4" height="4" />
        <rect x="8" y="53" width="4" height="4" />

        {/* Dense QR Pattern Modules */}
        <rect x="37" y="20" width="5" height="5" />
        <rect x="46" y="20" width="5" height="5" />
        <rect x="55" y="20" width="5" height="5" />

        <rect x="20" y="37" width="5" height="5" />
        <rect x="29" y="37" width="5" height="5" />
        <rect x="65" y="37" width="5" height="5" />
        <rect x="74" y="37" width="5" height="5" />
        <rect x="83" y="37" width="5" height="5" />

        <rect x="20" y="46" width="5" height="5" />
        <rect x="38" y="46" width="5" height="5" />
        <rect x="56" y="46" width="5" height="5" />
        <rect x="74" y="46" width="5" height="5" />
        <rect x="83" y="46" width="5" height="5" />

        <rect x="20" y="55" width="5" height="5" />
        <rect x="29" y="55" width="5" height="5" />
        <rect x="65" y="55" width="5" height="5" />
        <rect x="83" y="55" width="5" height="5" />

        <rect x="37" y="65" width="5" height="5" />
        <rect x="46" y="65" width="5" height="5" />
        <rect x="55" y="65" width="5" height="5" />
        <rect x="65" y="65" width="5" height="5" />
        <rect x="74" y="65" width="5" height="5" />

        <rect x="37" y="74" width="5" height="5" />
        <rect x="55" y="74" width="5" height="5" />
        <rect x="74" y="74" width="5" height="5" />
        <rect x="83" y="74" width="5" height="5" />

        <rect x="37" y="83" width="5" height="5" />
        <rect x="46" y="83" width="5" height="5" />
        <rect x="65" y="83" width="5" height="5" />
        <rect x="83" y="83" width="5" height="5" />

        {/* Center Emblem Shield */}
        <circle cx="50" cy="50" r="13" fill="white" stroke={color} strokeWidth="2.5" />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
        >
          {badge}
        </text>
      </svg>
    </div>
  );
}
