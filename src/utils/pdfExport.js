// Conversion d'une feuille A4 (DOM) en vrai fichier PDF, pour le
// téléchargement et les pièces jointes e-mail / partage WhatsApp.
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_W = 210;
const A4_H = 297;

export async function elementToPdf(element) {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const imgHeightMm = (canvas.height * A4_W) / canvas.width;
  const img = canvas.toDataURL('image/jpeg', 0.92);

  if (imgHeightMm <= A4_H + 1) {
    pdf.addImage(img, 'JPEG', 0, 0, A4_W, Math.min(imgHeightMm, A4_H));
    return pdf;
  }

  // Document plus long qu'une page : découpage en pages A4 successives
  let offset = 0;
  while (offset < imgHeightMm - 0.5) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, -offset, A4_W, imgHeightMm);
    offset += A4_H;
  }
  return pdf;
}

export async function downloadElementAsPdf(element, filename = 'document.pdf') {
  const pdf = await elementToPdf(element);
  pdf.save(filename);
}

/** Renvoie { base64, blob, file } prêt à joindre à un e-mail ou à partager. */
export async function elementToPdfPayload(element, filename = 'document.pdf') {
  const pdf = await elementToPdf(element);
  const blob = pdf.output('blob');
  const dataUri = pdf.output('datauristring');
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'application/pdf' }) : null;
  return { base64, blob, file, filename };
}
