import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

/**
 * Estampa un texto (el DNI del estudiante) como marca de agua diagonal repetida
 * en TODAS las páginas del PDF. Mantiene la estructura original del documento:
 * solo agrega la capa de texto, no reconstruye el PDF.
 *
 * @param bytes  Contenido del PDF original (tal cual lo baja el proxy).
 * @param texto  Texto de la marca (DNI). Si viene vacío, usa "PROTEGIDO".
 * @returns      Nuevos bytes del PDF ya watermarkeado.
 */
export async function watermarkPdf(bytes: ArrayBuffer, texto: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marca = (texto || '').trim() || 'PROTEGIDO';

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const size = 12;
    const stepX = 210;
    const stepY = 150;
    for (let y = -stepY; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        page.drawText(marca, {
          x,
          y,
          size,
          font,
          color: rgb(0.55, 0.55, 0.6),
          opacity: 0.16,
          rotate: degrees(35),
        });
      }
    }
  }

  return pdf.save();
}

/** Dispara la descarga de unos bytes PDF con el nombre indicado. */
export function descargarBytesPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Crea un blob URL para visualizar el PDF en un iframe. */
export function bytesToBlobUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
