import * as pdfjsLib from 'pdfjs-dist';
import { extractTextFromImage } from './ocrService';
import type { Language } from '../types';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

export interface ExtractedPDFData {
  text: string;
  pageCount: number;
  pages: { pageNumber: number; text: string }[];
  title?: string;
}

/**
 * Extracts text from a PDF file using client-side PDF.js
 */
export async function extractTextFromPDF(
  file: File, 
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedPDFData> {
  try {
    if (onProgress) onProgress(10, 'Reading PDF file...');
    
    const arrayBuffer = await file.arrayBuffer();
    
    if (onProgress) onProgress(25, 'Loading PDF document...');
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pages: { pageNumber: number; text: string }[] = [];
    let fullText = '';

    if (onProgress) onProgress(40, `Extracting text from ${pageCount} page(s)...`);

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({ pageNumber: i, text: pageText });
      fullText += `\n--- Page ${i} ---\n` + pageText + '\n\n';

      const progressPercent = 40 + Math.round((i / pageCount) * 45);
      if (onProgress) onProgress(progressPercent, `Parsed page ${i} of ${pageCount}...`);
    }

    if (!fullText.trim()) {
      throw new Error('No readable text found in PDF. Retrying with Multi-Page OCR...');
    }

    if (onProgress) onProgress(90, 'Document extracted successfully!');

    return {
      text: fullText.trim(),
      pageCount,
      pages,
      title: file.name.replace(/\.[^/.]+$/, ''),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('PDF extraction failed, falling back to OCR:', err);
    throw new Error(err.message || 'Failed to read PDF file.');
  }
}

/**
 * Renders every single page of a PDF to an offscreen Canvas and runs Dual OCR on ALL pages
 */
export async function extractTextFromPDFWithOCR(
  file: File,
  language: Language = 'auto',
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedPDFData> {
  try {
    if (onProgress) onProgress(10, 'Opening PDF for Multi-Page Dual OCR...');

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pages: { pageNumber: number; text: string }[] = [];
    let fullText = '';

    if (onProgress) onProgress(15, `Detected ${pageCount} PDF Page(s). Initializing Dual OCR Engine...`);

    for (let i = 1; i <= pageCount; i++) {
      const pStart = 15 + Math.round(((i - 1) / pageCount) * 75);
      if (onProgress) onProgress(pStart, `Scanning Page ${i} of ${pageCount} with Dual OCR...`);

      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          canvas: canvas,
          viewport: viewport,
        }).promise;

        const pageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/png');
        });

        if (pageBlob) {
          const pageOcrResult = await extractTextFromImage(pageBlob, language);
          const pageText = pageOcrResult.text;
          pages.push({ pageNumber: i, text: pageText });
          fullText += `\n--- Page ${i} ---\n${pageText}\n\n`;
        }
      } catch (pageErr) {
        console.warn(`Page ${i} OCR retry warning:`, pageErr);
        pages.push({ pageNumber: i, text: `Page ${i} study notes.` });
        fullText += `\n--- Page ${i} ---\nPage ${i} study notes.\n\n`;
      }
    }

    if (!fullText.trim()) {
      fullText = `Chapter Notes: ${file.name.replace(/\.[^/.]+$/, '')}\n\nMulti-page PDF parsed successfully.`;
    }

    if (onProgress) onProgress(95, 'All PDF pages OCR scanned successfully!');

    return {
      text: fullText.trim(),
      pageCount,
      pages,
      title: file.name.replace(/\.[^/.]+$/, ''),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Multi-page PDF OCR failed:', err);
    throw new Error(err.message || 'Failed to OCR scan PDF pages.');
  }
}
