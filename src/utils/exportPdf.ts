import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface ExportPdfOptions {
  leagueName?: string;
  week?: number;
  isDarkMode?: boolean;
  onProgress?: (progress: { current: number; total: number; message: string }) => void;
}

/**
 * Standard Letter portrait dimensions at 96 DPI:
 * 8.5 inches * 96 = 816 px width
 * 11.0 inches * 96 = 1056 px height
 * Exact Aspect Ratio: 8.5 / 11 = 0.772727
 */
const LETTER_WIDTH_PX = 816;
const LETTER_HEIGHT_PX = 1056;

/**
 * Directly exports the 3-Page Weekly Gazette Report as a full-bleed, high-resolution PDF file.
 * Formats every page precisely to US Letter portrait proportions so content fills the entire
 * page with zero wasted margins, preserving exact dark mode styling and typography.
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
    message: 'Formatting Gazette pages for Letter PDF...',
  });

  // Preserve original inline styles to restore after export
  const originalDocStyles = {
    width: gazetteDoc.style.width,
    maxWidth: gazetteDoc.style.maxWidth,
    minWidth: gazetteDoc.style.minWidth,
    margin: gazetteDoc.style.margin,
    boxShadow: gazetteDoc.style.boxShadow,
    borderRadius: gazetteDoc.style.borderRadius,
    border: gazetteDoc.style.border,
  };

  const originalPageStyles = pageElements.map((el) => ({
    width: el.style.width,
    maxWidth: el.style.maxWidth,
    minWidth: el.style.minWidth,
    height: el.style.height,
    minHeight: el.style.minHeight,
    boxSizing: el.style.boxSizing,
    borderBottom: el.style.borderBottom,
    padding: el.style.padding,
  }));

  try {
    // 1. Explicitly constrain gazetteDoc to the standard Letter width and square corners
    gazetteDoc.style.width = `${LETTER_WIDTH_PX}px`;
    gazetteDoc.style.maxWidth = `${LETTER_WIDTH_PX}px`;
    gazetteDoc.style.minWidth = `${LETTER_WIDTH_PX}px`;
    gazetteDoc.style.margin = '0 auto';
    gazetteDoc.style.boxShadow = 'none';
    gazetteDoc.style.borderRadius = '0';
    gazetteDoc.style.border = 'none';

    // 2. Format each page section to exact Letter dimensions
    pageElements.forEach((el) => {
      el.style.width = `${LETTER_WIDTH_PX}px`;
      el.style.maxWidth = `${LETTER_WIDTH_PX}px`;
      el.style.minWidth = `${LETTER_WIDTH_PX}px`;
      el.style.boxSizing = 'border-box';
      el.style.borderBottom = 'none';
      el.style.minHeight = `${LETTER_HEIGHT_PX}px`;
    });

    // Allow DOM reflow so all flex columns and grids calculate at Letter dimensions
    await new Promise((r) => setTimeout(r, 120));

    // Standard Letter in mm: 215.9 x 279.4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();   // 215.9 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 279.4 mm
    const letterRatio = pageWidth / pageHeight;           // 0.772727

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];
      const pageNum = i + 1;

      options.onProgress?.({
        current: pageNum,
        total: totalPages,
        message: `Rendering Page ${pageNum} of ${totalPages} (${getPageTitle(pageNum)})...`,
      });

      // Small pause to allow UI update
      await new Promise((r) => setTimeout(r, 60));

      // Calculate the natural content height (at least 1056px to fill Letter)
      const measuredHeight = Math.max(LETTER_HEIGHT_PX, pageEl.scrollHeight, pageEl.offsetHeight);
      pageEl.style.height = `${measuredHeight}px`;

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(pageEl, {
          scale: 2, // 2x high resolution for crisp text & borders
          width: LETTER_WIDTH_PX,
          height: measuredHeight,
          windowWidth: LETTER_WIDTH_PX,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 8000,
          backgroundColor: isDark ? '#0b0f19' : '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
      } catch (firstErr) {
        console.warn(`High-fidelity render for page ${pageNum} encountered an issue, trying safe fallback:`, firstErr);
        // Fallback: render without blocking on problematic images
        canvas = await html2canvas(pageEl, {
          scale: 1.5,
          width: LETTER_WIDTH_PX,
          height: measuredHeight,
          windowWidth: LETTER_WIDTH_PX,
          useCORS: false,
          allowTaint: false,
          imageTimeout: 4000,
          backgroundColor: isDark ? '#0b0f19' : '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: (el) => {
            if (el.tagName === 'IMG') {
              const img = el as HTMLImageElement;
              return !img.complete || img.naturalWidth === 0;
            }
            return false;
          },
        });
      }

      // Fill full background of PDF page to match theme completely
      if (isDark) {
        pdf.setFillColor(11, 15, 25); // #0b0f19
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const contentRatio = LETTER_WIDTH_PX / measuredHeight;

      // If content ratio matches Letter within 6%, fill the entire page full-bleed
      if (Math.abs(contentRatio - letterRatio) <= 0.06) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      } else if (contentRatio < letterRatio) {
        // Content is taller than Letter: scale to pageHeight to avoid cutting anything off
        const renderWidth = pageHeight * contentRatio;
        const posX = Math.max(0, (pageWidth - renderWidth) / 2);
        pdf.addImage(imgData, 'JPEG', posX, 0, renderWidth, pageHeight, undefined, 'FAST');
      } else {
        // Content is wider than Letter: scale to pageWidth
        const renderHeight = pageWidth / contentRatio;
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, renderHeight, undefined, 'FAST');
      }

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

    try {
      pdf.save(fileName);
    } catch (saveErr) {
      console.warn('pdf.save failed, triggering manual blob download:', saveErr);
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 500);
    }

    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    // Restore all original styles
    Object.assign(gazetteDoc.style, originalDocStyles);
    pageElements.forEach((el, idx) => {
      Object.assign(el.style, originalPageStyles[idx]);
    });
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
