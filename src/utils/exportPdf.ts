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
 * Converts an existing loaded <img> or fetched image resource into a base64 PNG data URL.
 * Converts external SVG avatars (like Dicebear) into high-resolution raster PNGs so that
 * html2canvas renders them with 100% reliability, bypassing CORS cache issues and browser SVG restrictions.
 */
async function convertImageToDataUrl(img: HTMLImageElement): Promise<string> {
  const originalSrc = img.src;
  if (!originalSrc || originalSrc.startsWith('data:image/')) {
    return originalSrc;
  }

  // 1. First attempt: If image is already rendered in the DOM, snapshot it directly to a canvas
  if (img.complete && img.naturalWidth > 0) {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = c.toDataURL('image/png');
        if (dataUrl && dataUrl.startsWith('data:image/png') && dataUrl.length > 100) {
          return dataUrl;
        }
      }
    } catch {
      // If canvas was tainted, proceed to fetch
    }
  }

  // 2. Second attempt: Fetch the image directly via CORS
  try {
    const res = await fetch(originalSrc, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      const blob = await res.blob();
      const isSvg = blob.type.includes('svg') || originalSrc.toLowerCase().includes('.svg');

      if (isSvg) {
        // Rasterize SVG blob onto an off-screen canvas to produce a clean PNG data URL
        const pngFromSvg = await rasterizeSvgBlob(blob, img.width || 48, img.height || 48);
        return pngFromSvg;
      } else {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (fetchErr) {
    console.warn('Direct fetch failed for image in Gazette:', originalSrc, fetchErr);
  }

  // 3. Third attempt (fail-safe): Generate a crisp, branded monogram avatar so no image is ever blank
  return generateMonogramAvatar(img.alt || 'Team', img.width || 48, img.height || 48);
}

/**
 * Rasterizes an SVG Blob onto a high-DPI HTML5 canvas and exports as PNG data URL.
 */
function rasterizeSvgBlob(blob: Blob, targetWidth: number, targetHeight: number): Promise<string> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';

    tempImg.onload = () => {
      try {
        const c = document.createElement('canvas');
        const sizeW = Math.max((targetWidth || 48) * 2, 96);
        const sizeH = Math.max((targetHeight || 48) * 2, 96);
        c.width = sizeW;
        c.height = sizeH;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempImg, 0, 0, sizeW, sizeH);
          const pngUrl = c.toDataURL('image/png');
          URL.revokeObjectURL(objectUrl);
          resolve(pngUrl);
          return;
        }
      } catch (err) {
        console.warn('Failed to rasterize SVG canvas:', err);
      }
      URL.revokeObjectURL(objectUrl);
      resolve(objectUrl);
    };

    tempImg.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: convert raw blob directly to base64
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    };

    tempImg.src = objectUrl;
  });
}

/**
 * Generates an elegant, circular sports-styled monogram avatar for any missing or un-fetchable image.
 */
function generateMonogramAvatar(label: string, width: number, height: number): string {
  const c = document.createElement('canvas');
  const size = Math.max((width || 48) * 2, 96);
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  const clean = (label || 'Team').replace(/[^a-zA-Z0-9]/g, '').trim();
  const initials = (clean.slice(0, 2) || 'FF').toUpperCase();

  const colorPalettes = [
    ['#0f172a', '#2563eb'],
    ['#064e3b', '#059669'],
    ['#78350f', '#d97706'],
    ['#4c1d95', '#7c3aed'],
    ['#831843', '#db2777'],
    ['#164e63', '#0891b2'],
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  const [darkCol, lightCol] = colorPalettes[Math.abs(hash) % colorPalettes.length];

  // Draw gradient circular background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, darkCol);
  grad.addColorStop(1, lightCol);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner border ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = Math.max(2, Math.round(size * 0.04));
  ctx.stroke();

  // Initials text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.42)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 1);

  return c.toDataURL('image/png');
}

/**
 * Pre-processes all <img> elements within the container to convert them to local Base64 data URLs.
 * Returns a restore function that resets all image tags to their original source attributes.
 */
async function inlineAllImagesForExport(container: HTMLElement): Promise<() => void> {
  const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
  const originalSources: { el: HTMLImageElement; src: string }[] = [];

  const conversionPromises = images.map(async (img) => {
    const originalSrc = img.src;
    originalSources.push({ el: img, src: originalSrc });

    try {
      const dataUrl = await convertImageToDataUrl(img);
      if (dataUrl) {
        img.src = dataUrl;
      }
    } catch (e) {
      console.warn('Failed to inline image for PDF export:', originalSrc, e);
    }
  });

  await Promise.all(conversionPromises);

  // Allow a micro-task tick for browsers to bind updated image sources
  await new Promise((r) => setTimeout(r, 60));

  return () => {
    originalSources.forEach(({ el, src }) => {
      el.src = src;
    });
  };
}

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
    message: 'Pre-rendering and embedding all team avatars...',
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

  // Step A: Inline and rasterize every image in the document to ensure 100% render fidelity
  let restoreImages: (() => void) | null = null;

  try {
    restoreImages = await inlineAllImagesForExport(gazetteDoc);

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
          imageTimeout: 10000,
          backgroundColor: isDark ? '#0b0f19' : '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
      } catch (firstErr) {
        console.warn(`High-fidelity render for page ${pageNum} encountered an issue, trying resilient fallback:`, firstErr);
        // Resilient fallback with scale 1.5
        canvas = await html2canvas(pageEl, {
          scale: 1.5,
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
    // Restore all inlined image sources
    if (restoreImages) {
      restoreImages();
    }

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
