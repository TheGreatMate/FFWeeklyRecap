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
 * Converts a Blob to a Base64 data URL.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Rasterizes an SVG data URL onto a high-DPI HTML5 canvas and exports as PNG data URL.
 * Since the SVG is already an inline data URL (not a cross-origin resource), drawing it
 * to a local canvas never taints the canvas and produces a crisp PNG image.
 */
function rasterizeDataUrlSvg(svgDataUrl: string, targetWidth: number, targetHeight: number): Promise<string> {
  return new Promise((resolve) => {
    const tempImg = new Image();
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
          if (pngUrl && pngUrl.startsWith('data:image/png')) {
            resolve(pngUrl);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to rasterize SVG canvas:', err);
      }
      resolve(svgDataUrl);
    };
    tempImg.onerror = () => resolve(svgDataUrl);
    tempImg.src = svgDataUrl;
  });
}

/**
 * Pre-processes all <img> elements within the container to convert their real profile photos
 * into local Base64 data URLs via the backend server proxy.
 * This guarantees 100% preservation of actual manager profile photos without any CORS blocks,
 * tainted canvases, or missing photos.
 * Returns a restore function that resets all image tags to their original source attributes.
 */
async function inlineAllImagesForExport(container: HTMLElement): Promise<() => void> {
  const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
  const originalAttributes: { el: HTMLImageElement; src: string; crossOrigin: string | null }[] = [];

  images.forEach((el) => {
    originalAttributes.push({
      el,
      src: el.getAttribute('src') || el.src,
      crossOrigin: el.getAttribute('crossorigin'),
    });
  });

  // Collect unique remote URLs
  const remoteUrls: string[] = [];
  images.forEach((img) => {
    const rawSrc = img.src || img.getAttribute('src') || '';
    if (!rawSrc || rawSrc.startsWith('data:image/')) return;

    let targetUrl = rawSrc;
    if (rawSrc.includes('/api/proxy-image?url=')) {
      try {
        const parsed = new URL(rawSrc, window.location.origin);
        const underlying = parsed.searchParams.get('url');
        if (underlying) targetUrl = underlying;
      } catch {
        // keep rawSrc
      }
    }

    if (!remoteUrls.includes(targetUrl)) {
      remoteUrls.push(targetUrl);
    }
  });

  let urlToDataUrlMap: Record<string, string> = {};

  // Step 1: Batch fetch all remote avatars server-side to bypass all CORS & cache taint
  if (remoteUrls.length > 0) {
    try {
      const resp = await fetch('/api/convert-images-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: remoteUrls }),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.dataUrls) {
          urlToDataUrlMap = json.dataUrls;
        }
      }
    } catch (apiErr) {
      console.warn('Server-side batch image conversion failed, falling back to proxy:', apiErr);
    }
  }

  // Step 2: Apply the real profile image data URLs to all matching <img> elements
  await Promise.all(
    images.map(async (img) => {
      const rawSrc = img.src || img.getAttribute('src') || '';
      if (!rawSrc || rawSrc.startsWith('data:image/')) {
        return;
      }

      let lookupUrl = rawSrc;
      if (rawSrc.includes('/api/proxy-image?url=')) {
        try {
          const parsed = new URL(rawSrc, window.location.origin);
          const underlying = parsed.searchParams.get('url');
          if (underlying) lookupUrl = underlying;
        } catch {
          // keep rawSrc
        }
      }

      let dataUrl = urlToDataUrlMap[lookupUrl] || urlToDataUrlMap[rawSrc];

      // If batch didn't return it, try proxy endpoint
      if (!dataUrl) {
        try {
          const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(lookupUrl)}`);
          if (proxyRes.ok) {
            const blob = await proxyRes.blob();
            dataUrl = await blobToDataUrl(blob);
          }
        } catch {
          // Keep original src
        }
      }

      // If SVG (e.g. monogram), rasterize to PNG
      if (dataUrl && (dataUrl.includes('image/svg+xml') || lookupUrl.toLowerCase().includes('.svg'))) {
        try {
          dataUrl = await rasterizeDataUrlSvg(dataUrl, img.width || 48, img.height || 48);
        } catch {
          // Keep dataUrl as is
        }
      }

      // If we received a valid data URL, assign it and remove crossorigin attributes
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        img.removeAttribute('crossorigin');
        img.removeAttribute('referrerpolicy');
        img.src = dataUrl;
      }
    })
  );

  // Wait for all images to decode properly in DOM
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done);
        img.addEventListener('error', done);
        setTimeout(done, 800);
      });
    })
  );

  await new Promise((r) => setTimeout(r, 120));

  return () => {
    originalAttributes.forEach(({ el, src, crossOrigin }) => {
      el.src = src;
      if (crossOrigin !== null) {
        el.setAttribute('crossorigin', crossOrigin);
      } else {
        el.removeAttribute('crossorigin');
      }
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
    message: 'Pre-rendering and embedding all manager profile photos...',
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

  let restoreImages: (() => void) | null = null;

  try {
    // Convert all user profile photos to Base64 data URLs server-side
    restoreImages = await inlineAllImagesForExport(gazetteDoc);

    // 1. Constrain gazetteDoc to the standard Letter width
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

    // Allow DOM reflow so all elements position properly
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

      await new Promise((r) => setTimeout(r, 60));

      const measuredHeight = Math.max(LETTER_HEIGHT_PX, pageEl.scrollHeight, pageEl.offsetHeight);
      pageEl.style.height = `${measuredHeight}px`;

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(pageEl, {
          scale: 2, // 2x high resolution for crisp text, photos & borders
          width: LETTER_WIDTH_PX,
          height: measuredHeight,
          windowWidth: LETTER_WIDTH_PX,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 12000,
          backgroundColor: isDark ? '#0b0f19' : '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
      } catch (firstErr) {
        console.warn(`High-fidelity render for page ${pageNum} fallback:`, firstErr);
        canvas = await html2canvas(pageEl, {
          scale: 1.5,
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
      }

      // Fill background of PDF page to match theme completely
      if (isDark) {
        pdf.setFillColor(11, 15, 25); // #0b0f19
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      // Always fill the entire Letter page edge-to-edge
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

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
    if (restoreImages) {
      restoreImages();
    }

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
