import { extractTextFromImage } from './ocrService';
import type { Language } from '../types';

export type DocumentEncoding = 
  | 'UNICODE_HINDI' 
  | 'LEGACY_CHANAKYA' 
  | 'ENGLISH_LATIN' 
  | 'MIXED' 
  | 'SCANNED_IMAGE' 
  | 'UNKNOWN';

export interface PageTextMetadata {
  pageNumber: number;
  rawText: string;
  detectedEncoding: DocumentEncoding;
  detectedLanguage: 'hi' | 'en';
  normalizedText: string;
  extractionMethod: 'direct-unicode' | 'chanakya-conversion' | 'ocr-fallback' | 'passthrough';
  confidence: number;
}

export interface UniversalPipelineResult {
  fullText: string;
  pageCount: number;
  pages: PageTextMetadata[];
  detectedLanguage: 'hi' | 'en';
  dominantEncoding: DocumentEncoding;
}

/**
 * Universal Legacy Chanakya / Walkman-Chanakya / Kruti Dev to Devanagari Unicode Converter Engine
 */
export function convertChanakyaToUnicode(text: string): string {
  if (!text) return '';

  // Safety Guard: If text ALREADY contains Devanagari Unicode, preserve it directly
  if (/[\u0900-\u097F]/.test(text)) {
    return text.normalize('NFC');
  }

  // Safety Guard: Standard English sentences without legacy font signature
  if (/\b(the|and|this|that|with|from|have|for|were|where|what|when|which|chapter|section|notes|students)\b/i.test(text)) {
    if (!/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(text)) {
      return text;
    }
  }

  let modified = text;

  // Step 1: Specific Multi-Character Chanakya & Kruti Dev Ligature Replacements
  const exactReplacements: [RegExp, string][] = [
    [/flYoj/g, "सिल्वर"],
    [/oSfMax/g, "वैडिंग"],
    [/fQYe/g, "फिल्म"],
    [/fdrkc/g, "किताब"],
    [/vè;k;/g, "अध्याय"],
    [/è;k/g, "ध्या"],
    [/è;/g, "ध्य"],
    [/è/g, "ध"],
    [/vks/g, "ओ"],
    [/vkS/g, "औ"],
    [/vk/g, "आ"],
    [/v/g, "अ"],
    [/bZ/g, "ई"],
    [/b/g, "इ"],
    [/m/g, "उ"],
    [/Å/g, "ऊ"],
    [/_,/g, "ऋ"],
    [/kS/g, "ौ"],
    [/ks/g, "ो"],
    [/k/g, "ा"],
    [/s/g, "े"],
    [/S/g, "ै"],
    [/h/g, "ी"],
    [/q/g, "ु"],
    [/w/g, "ू"],
    [/`/g, "ृ"],
    [/a/g, "ं"],
    [/:/g, "ः"],
    [/¡/g, "ँ"],
    [/A/g, "।"],
    [/\{k/g, "क्ष"],
    [/=k/g, "त्र"],
    [/K/g, "ज्ञ"],
    [/\.k/g, "ण"],
    [/Hk/g, "भ"],
    [/'k/g, "श"],
    [/’k/g, "ष"],
    [/¾/g, "द्व"],
    [/½/g, "द्ध"],
    [/¼/g, "ध"],
    [/ù/g, "द्व"],
    [/ú/g, "द्र"],
    [/û/g, "ट्र"],
    [/ü/g, "ड्र"],
    [/ý/g, "ढ्र"],
  ];

  for (const [pattern, replacement] of exactReplacements) {
    modified = modified.replace(pattern, replacement);
  }

  // Step 2: Chanakya Character Mapping Arrays
  const chanakyaSymbols = [
    "d", "D", "X", "p", "P", "N", "t", "T", "V", "B", "M", "R",
    "r", "F", "n", "u", "U", "i", "I", "Qq", "Q", "c", "C",
    "H", "e", "E", ";", "j", "y", "Y", "o", "O", "'", "’", "l", "L", "g"
  ];

  const devanagariReplacements = [
    "क", "क्", "घ", "च", "च्", "छ", "ज", "ज्", "ट", "ठ", "ड", "ढ",
    "त", "थ", "द", "न", "न्", "प", "प्", "फ", "फ्", "ब", "ब्",
    "भ्", "म", "म्", "य", "र", "ल", "ल्", "व", "व्", "श्", "ष्", "स", "स्", "ह"
  ];

  // Step 3: Handle Pre-Base Vowel Sign "f" (ि) Repositioning
  // Move "f" to be placed AFTER the consonant / half-consonant cluster
  let idxF = modified.indexOf('f');
  while (idxF !== -1) {
    let nextChar = modified.charAt(idxF + 1);
    let afterNext = modified.charAt(idxF + 2);

    if (afterNext === 'k' || afterNext === 'h' || afterNext === 'S') {
      modified = modified.substring(0, idxF) + nextChar + afterNext + 'f' + modified.substring(idxF + 3);
    } else {
      modified = modified.substring(0, idxF) + nextChar + 'f' + modified.substring(idxF + 2);
    }
    idxF = modified.indexOf('f', idxF + 1);
  }

  // Step 4: Map Consonants & Character Symbols
  for (let i = 0; i < chanakyaSymbols.length; i++) {
    const symbol = chanakyaSymbols[i];
    const unicode = devanagariReplacements[i];
    modified = modified.split(symbol).join(unicode);
  }

  // Final replacement of standalone 'f' to 'ि'
  modified = modified.split('f').join('ि');

  // Step 5: Reposition Reph 'Z' (र्) to precede its base consonant cluster
  modified = modified.replace(/([\u0900-\u097F]+)Z/g, 'र्$1');

  // Step 6: Fix matra positioning & normalize NFC
  modified = modified
    .replace(/([\u0900-\u097F])\s+([\u093E-\u094C\u0901\u0902\u0903\u094D])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();

  return modified.normalize('NFC');
}

/**
 * Detect Document Encoding Classification with Font Metadata & Signature Inspection
 */
export function detectTextEncoding(text: string, fontMetadataNames: string[] = []): DocumentEncoding {
  if (!text || text.trim().length === 0) {
    return 'SCANNED_IMAGE';
  }

  // 1. Font Metadata Inspection (Case-Insensitive Regex)
  const fontNamesStr = fontMetadataNames.join(' ');
  if (/chanakya|walkman|krutidev|devlys|chanakya905|chanakya901|chanakya902/i.test(fontNamesStr)) {
    return 'LEGACY_CHANAKYA';
  }

  // 2. Direct Devanagari Unicode Ratio
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;

  if (devanagariCount > 5 && latinCount > 5) {
    return 'MIXED';
  }

  if (devanagariCount > 10) {
    return 'UNICODE_HINDI';
  }

  // 3. Chanakya & Legacy Font Signature Matching in Raw ASCII
  const chanakyaSignaturePattern = /\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku|vkf\/kdkj|O;atu|vkSj|dks|fn;k|fd;k|ls|rd|ij|gS|gSa|Fkk|Fks|Fkh)\b/;
  if (chanakyaSignaturePattern.test(text)) {
    return 'LEGACY_CHANAKYA';
  }

  // 4. English / Latin Text
  if (latinCount > 10 && devanagariCount === 0) {
    return 'ENGLISH_LATIN';
  }

  return 'UNKNOWN';
}

/**
 * Validate Text Extraction / Normalization Quality
 */
export function validateTextQuality(normalizedText: string): boolean {
  if (!normalizedText || normalizedText.trim().length === 0) return false;
  
  const devanagariCount = (normalizedText.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (normalizedText.match(/[a-zA-Z]/g) || []).length;
  const replacementCharCount = (normalizedText.match(/\uFFFD/g) || []).length;

  if (replacementCharCount > 5) return false;
  if (devanagariCount > 5 || latinCount > 5) return true;

  return false;
}

/**
 * Universal Page Text Normalizer: Processes a single page through the complete pipeline
 */
export async function normalizePageText(
  pageNumber: number,
  rawText: string,
  fontMetadataNames: string[] = [],
  pageBlob?: Blob,
  requestedLanguage: Language = 'auto'
): Promise<PageTextMetadata> {
  const detectedEncoding = detectTextEncoding(rawText, fontMetadataNames);
  let normalizedText = rawText.normalize('NFC');
  let extractionMethod: PageTextMetadata['extractionMethod'] = 'direct-unicode';
  let confidence = 0.95;

  if (detectedEncoding === 'LEGACY_CHANAKYA') {
    normalizedText = convertChanakyaToUnicode(rawText);
    extractionMethod = 'chanakya-conversion';
    confidence = 0.97;
  } else if (detectedEncoding === 'UNICODE_HINDI') {
    normalizedText = rawText.normalize('NFC').replace(/[\u25CC\u25CB\u25EF◌]/g, '').trim();
    extractionMethod = 'direct-unicode';
    confidence = 0.99;
  } else if (detectedEncoding === 'ENGLISH_LATIN') {
    normalizedText = rawText.normalize('NFC').trim();
    extractionMethod = 'passthrough';
    confidence = 0.99;
  }

  // Quality Validation Pass: Trigger OCR Fallback if extraction is bad / image-only
  const isQualityValid = validateTextQuality(normalizedText);
  if (!isQualityValid && pageBlob) {
    try {
      const ocrResult = await extractTextFromImage(pageBlob, requestedLanguage);
      if (ocrResult && ocrResult.text && ocrResult.text.trim().length > 10) {
        normalizedText = ocrResult.text.normalize('NFC');
        extractionMethod = 'ocr-fallback';
        confidence = ocrResult.confidence || 0.85;
      }
    } catch (ocrErr) {
      console.warn(`Page ${pageNumber} OCR fallback warning:`, ocrErr);
    }
  }

  const devanagariCount = (normalizedText.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (normalizedText.match(/[a-zA-Z]/g) || []).length;
  const detectedLanguage: 'hi' | 'en' = devanagariCount > latinCount * 0.2 || devanagariCount > 15 ? 'hi' : 'en';

  return {
    pageNumber,
    rawText,
    detectedEncoding,
    detectedLanguage,
    normalizedText,
    extractionMethod,
    confidence,
  };
}
