import { GazetteReportData } from '../types';

/**
 * Robust print and PDF helper for the 3-Page Weekly Gazette Report.
 * Supports iframe embedding, HTTP Unraid local networks, and direct print dialogs.
 */
export function printGazetteElement(elementId: string = 'gazette-document') {
  const elem = document.getElementById(elementId);

  // If in a standard desktop browser where window.print() is allowed
  try {
    window.print();
  } catch (err) {
    console.warn('Direct window.print() failed, opening dedicated printable window:', err);
    if (elem) {
      openPrintWindowFromElement(elem);
    }
  }
}

/**
 * Opens a dedicated popup print window containing only the Gazette document
 * with inline typography and print stylesheets pre-loaded.
 */
export function openPrintWindowFromElement(elem: HTMLElement) {
  const printWindow = window.open('', '_blank', 'width=1000,height=1200,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site or use the "Download HTML / Print File" button.');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Weekly Gazette - Printable Edition</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    .playfair {
      font-family: 'Playfair Display', Georgia, serif;
    }
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
      @page {
        size: letter portrait;
        margin: 0.35in;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: sticky; top: 0; z-index: 50; background: #0f172a; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div>
      <span style="font-weight: bold; font-size: 14px;">The Weekly Gazette • Print / Save as PDF</span>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Choose "Save as PDF" as the printer destination in the print preview.</p>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer;">
        🖨️ Open Print / PDF Dialog
      </button>
      <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; cursor: pointer;">
        Close
      </button>
    </div>
  </div>

  <div style="max-width: 900px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden;">
    ${elem.innerHTML}
  </div>

  <script>
    window.addEventListener('load', () => {
      // Auto-trigger print after styles load
      setTimeout(() => {
        window.print();
      }, 600);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Downloads a standalone, self-contained HTML file of the Gazette report
 * that can be double-clicked to view and saved directly to PDF from any browser.
 */
export function downloadGazetteHTML(elem?: HTMLElement | null, leagueName: string = 'Fantasy_League', week: number = 1) {
  const target = elem || document.getElementById('gazette-document');
  if (!target) {
    alert('Gazette document not found to export. Please make sure Gazette View is selected.');
    return;
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${leagueName} - Week ${week} Gazette Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 24px;
    }
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
      @page {
        size: letter portrait;
        margin: 0.35in;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 900px; margin: 0 auto 16px auto; background: #0f172a; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
    <div>
      <h3 style="margin: 0; font-size: 14px; font-weight: bold;">📰 ${leagueName} - Week ${week} Gazette</h3>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">Click the button on the right to Print or Save as PDF</p>
    </div>
    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <div style="max-width: 900px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden;">
    ${target.innerHTML}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${leagueName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_week_${week}_gazette.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
