import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { StickyNote, DocumentSession } from '../types';

/**
 * Helper to clean bullet markers and artificial headers for single note exports
 */
function cleanNoteText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^([\s•\-\*\d\.\:\)\>\·\▪\■\□\◆\◇\✓\✔\★\☆\✦\✧]|•\s*)+/g, '')
    .replace(/^(?:[-•*0-9\.\s])+/g, '')
    .replace(/\b(Term Detail|Topic Explanation|Key Points|Main Keywords|मुख्य शब्द|परिभाषा|टर्म डिटेल)\b[\:\-]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Render an off-screen visual representation of a single sticky card and capture it as canvas
 */
async function captureStickyNoteCanvas(note: StickyNote): Promise<{ canvas: HTMLCanvasElement; title: string }> {
  const cleanTitleWithoutPrefix = cleanNoteText(note.title)
    .replace(/^[#+\s]+/, '')
    .trim();

  const displayTitle = cleanTitleWithoutPrefix || 'Sticky Note';
  const rawIntro = cleanNoteText(note.summary);
  const pageLabel = note.chapter || '1';

  const bullets = note.bullets && note.bullets.length > 0
    ? note.bullets.map(b => cleanNoteText(b)).filter(Boolean)
    : [rawIntro];

  const isEnglishContent = !/[\u0900-\u097F]/.test((note.title || '') + ' ' + (note.summary || ''));
  const topicBadge = isEnglishContent ? `Topic ${pageLabel}` : `टॉपिक ${pageLabel}`;

  const borderColorMap: Record<string, string> = {
    purple: '#e9d5ff',
    pink: '#fbcfe8',
    yellow: '#fde68a',
    blue: '#bae6fd',
    green: '#a7f3d0',
    orange: '#fed7aa',
  };
  const borderColor = borderColorMap[note.color || 'purple'] || '#e9d5ff';

  // Create off-screen DOM element that mirrors StickyNoteCard design exactly without height truncation or action buttons
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '380px';
  container.style.zIndex = '-9999';

  container.innerHTML = `
    <div style="
      background-color: #ffffff;
      border: 2px solid ${borderColor};
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      color: #111111;
      font-family: ${isEnglishContent ? "'Poppins', sans-serif" : "'Noto Sans Devanagari', 'Poppins', sans-serif"};
      box-sizing: border-box;
      width: 380px;
    ">
      <!-- Header: Topic Badge + Title + Push Pin -->
      <div style="
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      ">
        <div style="flex: 1;">
          <div style="
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.05em;
            color: #6C3BFF;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 2px;
          ">
            <span>📌</span>
            <span>${topicBadge}</span>
          </div>
          <h2 style="
            font-size: 13px;
            font-weight: 700;
            color: #6C3BFF;
            margin: 0;
            line-height: 1.35;
            word-break: break-word;
          ">
            ${displayTitle}
          </h2>
        </div>
        ${note.pinned ? `<div style="color: #e11d48; font-size: 14px; margin-left: 4px;">📌</div>` : ''}
      </div>

      <!-- Body: Full Key Points without height limits or line-clamp truncation -->
      <div style="padding-top: 10px; padding-bottom: 4px;">
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${bullets.map(bullet => `
            <li style="
              display: flex;
              align-items: flex-start;
              gap: 6px;
              font-size: 11px;
              line-height: 1.45;
              font-weight: 500;
              color: #111111;
              margin-bottom: 6px;
              word-break: break-word;
            ">
              <span style="color: #6C3BFF; font-weight: 900; flex-shrink: 0;">•</span>
              <span>${bullet}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const target = container.firstElementChild as HTMLElement;
  const canvas = await html2canvas(target, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  document.body.removeChild(container);
  return { canvas, title: cleanTitleWithoutPrefix };
}

/**
 * Export an individual StickyNote visually as a high-resolution PNG image
 */
export async function exportSingleStickyNoteAsImage(note: StickyNote): Promise<boolean> {
  try {
    const { canvas, title } = await captureStickyNoteCanvas(note);
    const safeTitle = (title || 'Sticky_Note')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 80);

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Notiq-Sticky-${safeTitle}.png`;
    link.href = imgData;
    link.click();
    return true;
  } catch (err) {
    console.error('Individual sticky PNG export failed:', err);
    return false;
  }
}

/**
 * Export an individual StickyNote visually as a high-quality PDF document preserving card design
 */
export async function exportSingleStickyNoteAsPDF(note: StickyNote): Promise<boolean> {
  try {
    const { canvas, title } = await captureStickyNoteCanvas(note);
    const safeTitle = (title || 'Sticky_Note')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 80);

    const imgData = canvas.toDataURL('image/png');

    const cardWidthMM = 120;
    const cardHeightMM = (canvas.height * cardWidthMM) / canvas.width;

    const pageMarginMM = 12;
    const pdfWidthMM = cardWidthMM + pageMarginMM * 2;
    const pdfHeightMM = cardHeightMM + pageMarginMM * 2;

    const pdf = new jsPDF({
      orientation: pdfWidthMM > pdfHeightMM ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidthMM, pdfHeightMM],
    });

    // Dark background page matching NOTIQ AI design system (#0C0A15)
    pdf.setFillColor(12, 10, 21);
    pdf.rect(0, 0, pdfWidthMM, pdfHeightMM, 'F');

    // Embed crisp card canvas centered
    pdf.addImage(imgData, 'PNG', pageMarginMM, pageMarginMM, cardWidthMM, cardHeightMM);

    pdf.save(`Notiq-Sticky-${safeTitle}.pdf`);
    return true;
  } catch (err) {
    console.error('Individual sticky PDF export failed:', err);
    return false;
  }
}

/**
 * Export an individual StickyNote as a plain text (.txt) file with UTF-8 encoding.
 * Preserves full title, topic, summary, all bullet points, keywords, and priority without truncation or AI regeneration.
 */
export function exportSingleStickyNote(note: StickyNote) {
  const rawTitle = note.title || 'Untitled_Sticky';
  const cleanTitle = rawTitle
    .replace(/^([\s•\-\*\d\.\:\)\>\·\▪\■\□\◆\◇\✓\✔\★\☆\✦\✧]|•\s*)+/g, '')
    .trim();

  // Create safe filename while preserving Devanagari / Unicode characters
  const safeFilenameTitle = (cleanTitle || 'Sticky_Note')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 80);

  const fileName = `Notiq-Sticky-${safeFilenameTitle}.txt`;

  let content = `📌 NOTIQ AI STICKY NOTE: ${cleanTitle}\n`;
  content += `====================================================\n`;
  if (note.chapter) {
    content += `Topic/Page: ${note.chapter}\n`;
  }
  if (note.priority) {
    content += `Priority: ${note.priority.toUpperCase()}\n`;
  }
  if (note.topic) {
    content += `Topic: ${note.topic}\n`;
  }
  content += `Exported On: ${new Date().toLocaleString()}\n`;
  content += `====================================================\n\n`;

  if (note.summary && note.summary.trim()) {
    content += `📖 SUMMARY / DESCRIPTION:\n${note.summary.trim()}\n\n`;
  }

  if (note.bullets && note.bullets.length > 0) {
    content += `📌 KEY REVISION POINTS:\n`;
    note.bullets.forEach((bullet) => {
      const cleanBullet = bullet
        .replace(/^([\s•\-\*\d\.\:\)\>\·\▪\■\□\◆\◇\✓\✔\★\☆\✦\✧]|•\s*)+/g, '')
        .trim();
      if (cleanBullet) {
        content += `- ${cleanBullet}\n`;
      }
    });
    content += `\n`;
  }

  content += `----------------------------------------------------\n`;
  content += `Generated with NOTIQ AI — Learn Smarter. Remember Better.\n`;

  // Use Blob with UTF-8 encoding for full Devanagari / Unicode fidelity
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download text content as a file (.md or .txt)
 */
export function exportAsMarkdown(session: DocumentSession | null, notes: StickyNote[]) {
  const title = session?.fileName || 'Notiq_AI_Notes';
  let mdContent = `# 📌 Notiq AI Study Notes: ${title}\n`;
  mdContent += `Generated on: ${new Date().toLocaleDateString()} | Total Notes: ${notes.length}\n`;
  mdContent += `Tagline: Learn Smarter. Remember Better.\n\n---\n\n`;

  notes.forEach((note, idx) => {
    mdContent += `### ${idx + 1}. ${note.title} [Priority: ${note.priority.toUpperCase()}]\n`;
    mdContent += `**Topic:** ${note.topic}\n\n`;
    mdContent += `**Summary:** ${note.summary}\n\n`;
    if (note.bullets.length > 0) {
      mdContent += `**Key Points:**\n`;
      note.bullets.forEach(b => {
        mdContent += `- ${b}\n`;
      });
      mdContent += '\n';
    }
    if (note.keywords.length > 0) {
      mdContent += `*Keywords:* ${note.keywords.join(', ')}\n\n`;
    }
    mdContent += `---\n\n`;
  });

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_NotiqNotes.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download raw JSON backup
 */
export function exportAsJSON(session: DocumentSession | null, notes: StickyNote[]) {
  const title = session?.fileName || 'Notiq_AI_Backup';
  const data = {
    app: 'Notiq AI',
    tagline: 'Learn Smarter. Remember Better.',
    version: '1.0',
    exportDate: new Date().toISOString(),
    session,
    notes,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}_NotiqBackup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export the full Sticky Board visually as a high-resolution PNG image.
 * Uses captureStickyNoteCanvas for every note to eliminate browser preview line-clamp/truncation,
 * preserving complete titles, complete summaries, all bullet points, card colors, borders, and Devanagari text.
 */
export async function exportAsPNG(
  notesOrElementId: StickyNote[] | string,
  fileName = 'Notiq_AI_Board'
): Promise<boolean> {
  try {
    let notes: StickyNote[] = [];
    if (Array.isArray(notesOrElementId)) {
      notes = notesOrElementId;
    } else {
      const el = document.getElementById(notesOrElementId);
      if (el) {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0c0a15',
          logging: false,
        });
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '_')}_Board.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        return true;
      }
      return false;
    }

    if (!notes || notes.length === 0) {
      return false;
    }

    const capturedCards: HTMLCanvasElement[] = [];
    for (const note of notes) {
      const { canvas } = await captureStickyNoteCanvas(note);
      capturedCards.push(canvas);
    }

    const cols = notes.length === 1 ? 1 : notes.length <= 4 ? 2 : 3;
    const margin = 40;
    const gap = 30;
    const cardWidth = capturedCards[0].width;

    const rows: HTMLCanvasElement[][] = [];
    for (let i = 0; i < capturedCards.length; i += cols) {
      rows.push(capturedCards.slice(i, i + cols));
    }

    const rowHeights = rows.map(row => Math.max(...row.map(c => c.height)));
    const totalWidth = margin * 2 + cols * cardWidth + (cols - 1) * gap;
    const totalHeight = margin * 2 + rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * gap;

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = totalWidth;
    mainCanvas.height = totalHeight;
    const ctx = mainCanvas.getContext('2d');
    if (!ctx) return false;

    ctx.fillStyle = '#0c0a15';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    let currentY = margin;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rHeight = rowHeights[r];
      for (let c = 0; c < row.length; c++) {
        const cardCanvas = row[c];
        const currentX = margin + c * (cardWidth + gap);
        ctx.drawImage(cardCanvas, currentX, currentY);
      }
      currentY += rHeight + gap;
    }

    const safeTitle = (fileName || 'Notiq_AI_Board')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 80);

    const imgData = mainCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${safeTitle}_Board.png`;
    link.href = imgData;
    link.click();
    return true;
  } catch (error) {
    console.error('PNG Export failed:', error);
    return false;
  }
}

/**
 * Export the entire Sticky Board visually as a high-quality PDF document.
 * Reuses captureStickyNoteCanvas to preserve exact card styling, colors, Devanagari typography,
 * topic badges, push pins, and full bullet points without truncation or quality loss.
 */
export async function exportAsPDF(
  notes: StickyNote[], 
  docTitle = 'Notiq AI Notes'
): Promise<boolean> {
  if (!notes || notes.length === 0) {
    return false;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 12;
    const colWidth = 88;
    const gapX = 10;
    const gapY = 10;

    const colX = [margin, margin + colWidth + gapX]; // [12, 110]
    let cursorY = margin;
    let rowStartY = margin;
    let rowMaxHeight = 0;
    let colIndex = 0;

    // Fill background for first page matching NOTIQ AI dark theme (#0C0A15)
    pdf.setFillColor(12, 10, 21);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const { canvas } = await captureStickyNoteCanvas(note);
      const imgData = canvas.toDataURL('image/png');
      const cardHeightMM = (canvas.height * colWidth) / canvas.width;

      if (colIndex === 0) {
        rowStartY = cursorY;
        rowMaxHeight = cardHeightMM;

        // Check if first card of row exceeds page boundary
        if (rowStartY + cardHeightMM > pageHeight - margin) {
          pdf.addPage();
          pdf.setFillColor(12, 10, 21);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          cursorY = margin;
          rowStartY = margin;
        }

        pdf.addImage(imgData, 'PNG', colX[0], rowStartY, colWidth, cardHeightMM);
        colIndex = 1;
      } else {
        // Second card in row
        if (rowStartY + cardHeightMM > pageHeight - margin) {
          // Overflow on second card - move it to top of new page as col 0
          pdf.addPage();
          pdf.setFillColor(12, 10, 21);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          cursorY = margin;
          rowStartY = margin;
          rowMaxHeight = cardHeightMM;
          pdf.addImage(imgData, 'PNG', colX[0], rowStartY, colWidth, cardHeightMM);
          colIndex = 1;
        } else {
          pdf.addImage(imgData, 'PNG', colX[1], rowStartY, colWidth, cardHeightMM);
          if (cardHeightMM > rowMaxHeight) {
            rowMaxHeight = cardHeightMM;
          }
          cursorY = rowStartY + rowMaxHeight + gapY;
          colIndex = 0;
          rowMaxHeight = 0;
        }
      }
    }

    const safeTitle = (docTitle || 'NotiqNotes')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 80);

    pdf.save(`${safeTitle}_NotiqNotes.pdf`);
    return true;
  } catch (error) {
    console.error('Board PDF Export failed:', error);
    return false;
  }
}

/**
 * Trigger print dialog with styled printable view
 */
export function triggerPrintNotes() {
  window.print();
}
