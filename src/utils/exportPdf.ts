import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  leagueName?: string;
  week?: number;
  isDarkMode?: boolean;
  onProgress?: (progress: { current: number; total: number; message: string }) => void;
}

/**
 * Directly exports the 3-Page Weekly Gazette Report as a high-resolution PDF file,
 * retaining the exact dark mode background, custom colors, player avatars, tables,
 * and typography without relying on browser print dialog quirks.
 */
export async function exportGazetteToPdf(options: ExportPdfOptions = {}): Promise<boolean> {
  const gazetteDoc = document.getElementById('gazette-document');
  if (!gazetteDoc) {
    console.error('Gazette document element "#gazette-document" not found.');
    return false;
  }

  const isDark = options.isDarkMode !== undefined
    ? options.isDarkMode
    : gazetteDoc.classList.contains('gazette-dark');

  // Select all pages within the Gazette document
  let pageElements = Array.from(gazetteDoc.querySelectorAll<HTMLElement>('[data-gazette-page]'));
  if (pageElements.length === 0) {
    pageElements = Array.from(gazetteDoc.querySelectorAll<HTMLElement>(':scope > section'));
  }

  if (pageElements.length === 0) {
    pageElements = [gazetteDoc];
  }

  const totalPages = pageElements.length;
  options.onProgress?.({
    current: 0,
    total: totalPages,
    message: 'Preparing Gazette pages for PDF generation...',
  });

  // Temporarily ensure high-fidelity layout width if currently on small viewport
  const originalWidth = gazetteDoc.style.width;
  const originalMaxWidth = gazetteDoc.style.maxWidth;
  const wasNarrow = window.innerWidth < 1000;

  if (wasNarrow) {
    gazetteDoc.style.width = '1000px';
    gazetteDoc.style.maxWidth = '1000px';
  }

  try {
    // Standard Letter in mm: 215.9 x 279.4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      const pageNum = i + 1;

      options.onProgress?.({
        current: pageNum,
        total: totalPages,
        message: `Rendering Page ${pageNum} of ${totalPages} (${getPageTitle(pageNum)})...`,
      });

      // Small pause to allow UI update
      await new Promise((r) => setTimeout(r, 40));

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x high resolution for crisp text & borders
        useCORS: true,
        allowTaint: false,
        imageTimeout: 8000,
        backgroundColor: isDark ? '#0b0f19' : '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024,
      });

      // Fill background of PDF page to match theme completely
      if (isDark) {
        pdf.setFillColor(11, 15, 25); // #0b0f19
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasWidth / canvasHeight;

      // Usable printable area with 4mm margins
      const margin = 4;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const usableRatio = usableWidth / usableHeight;

      let renderWidth = usableWidth;
      let renderHeight = renderWidth / canvasRatio;
      let posX = margin;
      let posY = margin;

      if (canvasRatio > usableRatio) {
        // Wider than printable area
        renderWidth = usableWidth;
        renderHeight = renderWidth / canvasRatio;
        posX = margin;
        posY = margin + (usableHeight - renderHeight) / 2;
      } else {
        // Taller than printable area
        renderHeight = usableHeight;
        renderWidth = renderHeight * canvasRatio;
        posX = margin + (usableWidth - renderWidth) / 2;
        posY = margin;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

      if (i < totalPages - 1) {
        pdf.addPage('letter', 'portrait');
      }
    }

    options.onProgress?.({
      current: totalPages,
      total: totalPages,
      message: 'Compiling and saving PDF...',
    });

    const safeLeague = (options.leagueName || 'League').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeWeek = options.week ? `_Week_${options.week}` : '';
    const modeTag = isDark ? '_Dark' : '_Print';
    const fileName = `${safeLeague}${safeWeek}_Gazette${modeTag}.pdf`;

    pdf.save(fileName);

    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    if (wasNarrow) {
      gazetteDoc.style.width = originalWidth;
      gazetteDoc.style.maxWidth = originalMaxWidth;
    }
  }
}

function getPageTitle(pageNum: number): string {
  switch (pageNum) {
    case 1:
      return 'Front Page';
    case 2:
      return 'The Ledger & Leaderboard';
    case 3:
      return 'Power Rankings & Notebook';
    default:
      return `Page ${pageNum}`;
  }
}
