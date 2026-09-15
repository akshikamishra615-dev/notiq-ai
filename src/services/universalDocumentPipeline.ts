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

  // Safety Guard 1: Direct Unicode Hindi without legacy signatures
  if (/[\u0900-\u097F]/.test(text) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(text)) {
    // If mixed with English, tokenize and convert only legacy ASCII tokens
    if (/[a-zA-Z]/.test(text)) {
      return text.split(/(\s+)/).map(token => {
        if (/[\u0900-\u097F]/.test(token)) return token;
        if (/^[a-zA-Z0-9.,!?'"()-]+$/.test(token) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(token)) {
          return token;
        }
        return convertChanakyaToUnicode(token);
      }).join('');
    }
    return text.normalize('NFC').replace(/एे/g, 'ऐ');
  }

  // Safety Guard 2: Plain English without legacy font signature
  if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(text)) {
    return text;
  }

  let str = text;

  // STEP 1: Multi-character ligatures & complex Chanakya patterns
  const ligatures: [string, string][] = [
    ['muosQ', 'उनके'],
    ['osQ', 'के'],
    ['o`Q', 'वृ'],
    ['o`', 'वृ'],
    ['veQ', 'एक'],
    ['oQ', 'क'],
    ['oq', 'कु'],
    ['rQ', 'रु'],

    ['I+kQ', 'फ़'],
    ['Ý+', 'फ़्र'],
    ['I+', 'फ़्'],
    ['iQ', 'फ'],
    ['I', 'फ्'],

    ['vkS', 'औ'],
    ['vks', 'ओ'],
    ['vk', 'आ'],
    ['vsa', 'एं'],
    ['vs', 'ए'],
    ['vS', 'ऐ'],
    ['bZ', 'ई'],
    ['b', 'इ'],
    ['m', 'उ'],
    ['Å', 'ऊ'],
    ['_,', 'ऋ'],

    ['flYoj', 'सिल्वर'],
    ['oSfMax', 'वैडिंग'],
    ['fQYe', 'फिल्म'],
    ['fdrkc', 'किताब'],
    ['vè;k;', 'अध्याय'],
    ['è;k', 'ध्या'],
    ['è;', 'ध्य'],
    ['èk', 'ध'],
    ['|', 'द्य'],
    ['¾', 'द्व'],
    ['½', 'द्ध'],
    ['¼', 'ध'],
    ['ù', 'द्व'],
    ['ú', 'द्र'],
    ['û', 'ट्र'],
    ['ü', 'ड्र'],
    ['ý', 'ढ्र'],

    ['xzs', 'ग्रे'],
    ['iz', 'प्र'],
    ['ç', 'प्र'],
    ['nz', 'द्र'],
    ['oz', 'व्र'],
    ['pz', 'त्र'],
    ['{k', 'क्ष'],
    ['=k', 'त्र'],
    ['M+', 'ड़'],
    ['<+', 'ढ़'],
    ['<', 'ढ़'],
    [' ढ+', 'ढ़'],
    [' ढ.', 'ढ़'],
    ['”k', 'ज़'],
    ['”', 'ज़'],
    ['\'k', 'श'],
    ['’k', 'ष'],
    ['Fk', 'थ'],
    ['Hk', 'भ'],
    ['.k', 'ण'],
    ['kS', 'ौ'],
    ['ks', 'ो'],
    ['sa', 'ें'],
    ['Sa', 'ैं'],
    ['k¡', 'ॉ'],
    ['¡', 'ँ'],
    ['â', 'ँ'],
    [':', 'ः'],
    ['A', '।'],
    ['¶', '“'],
    ['¸', '”'],
    ['`', 'ृ'],
    ['z', '्र'],
    ['ª', '्र'],

    ['ख्ा', 'ख'],
    ['घ्ा', 'घ'],
    ['द्ग', 'द्ग'],
    ['द्घ', 'द्घ'],
    ['द्ब', 'द्ब'],
    ['द्भ', 'द्भ'],
    ['द्म', 'द्म'],

    ['dkgkuh', 'कहानी'],
    ['fl¼kUr', 'सिद्धांत'],
    ['EkgÙoiw', 'महत्वपूर्'],
  ];

  for (const [pattern, replacement] of ligatures) {
    str = str.split(pattern).join(replacement);
  }

  // STEP 2: Pre-base short 'f' (ि) repositioning BEFORE character mapping
  let resultStr = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === 'f') {
      let j = i + 1;
      while (j < str.length && /[D[XPTBRMHVNWOLYS'`~zªFHCQ]/.test(str[j])) {
        j++;
      }
      if (j < str.length) {
        j++;
      }
      resultStr += str.substring(i + 1, j) + 'f';
      i = j;
    } else {
      resultStr += str[i];
      i++;
    }
  }
  str = resultStr;

  // STEP 3: Single Character Mapping
  const charMap: Record<string, string> = {
    'd': 'क', 'D': 'क्',
    '[': 'ख्',
    'x': 'ग', 'X': 'ग्',
    '?': 'घ्',
    'p': 'च', 'P': 'च्', 'C': 'च्',
    'N': 'छ',
    't': 'ज', 'T': 'ज्',
    'i': 'प',
    'e': 'म', 'E': 'म्',
    ';': 'य', 'W': 'य्',
    'j': 'र',
    'y': 'ल', 'Y': 'ल्',
    'o': 'व', 'O': 'व्',
    'l': 'स', 'L': 'स्',
    'g': 'ह',
    'r': 'त', 'R': 'त्',
    'n': 'द',
    'u': 'न', 'U': 'न्',
    'c': 'ब', 'B': 'ठ',
    'M': 'ड', 'Q': 'फ्',
    'K': 'ज्ञ',
    'v': 'अ',
    'k': 'ा',
    'h': 'ी',
    'q': 'ु',
    'w': 'ू',
    's': 'े',
    'S': 'ै',
    'a': 'ं',
    'f': 'ि',
    'V': 'ट',
    '>': 'झ',
    ',': 'ए',
    'F': 'थ्',
    'H': 'भ्',
    '\'': 'श्',
    ']': '।',
    '@': 'या',
    '~': '्',
  };

  let mappedStr = '';
  for (let idx = 0; idx < str.length; idx++) {
    const ch = str[idx];
    mappedStr += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  str = mappedStr;

  // STEP 4: Reph 'Z' (र्) Repositioning - Single Consonant Cluster Match
  str = str.replace(/([क-ह](?:्[क-ह])?[\u093E-\u094C\u0901\u0902\u0903]*)Z/g, 'र्$1');
  str = str.replace(/Z/g, 'र्');

  // STEP 5: Post-conversion Devanagari Cleanups
  str = str
    .replace(/दफ़्र तर/g, 'दफ़्तर')
    .replace(/फ़ि़/g, 'फ़ि')
    .replace(/फ़्ि/g, 'फ़ि')
    .replace(/एे/g, 'ऐ')
    .replace(/बॉध/g, 'बांध')
    .replace(/पॉच/g, 'पांच')
    .replace(/वैडंिग/g, 'वैडिंग')
    .replace(/([क-ह]्)\s+/g, '$1')
    .replace(/([\u0900-\u097F])\s+([\u093E-\u094C\u0901\u0902\u0903\u094D])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();

  return str.normalize('NFC');
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
 * Validate Text Extraction / Normalization Quality with Strict Structural Signals
 */
export function validateTextQuality(normalizedText: string): boolean {
  if (!normalizedText || normalizedText.trim().length === 0) return false;
  
  const replacementCharCount = (normalizedText.match(/\uFFFD/g) || []).length;
  if (replacementCharCount > 3) return false;

  // Leftover legacy font signatures in normalized text signal incomplete conversion
  const leftoverLegacyPattern = /\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/;
  if (leftoverLegacyPattern.test(normalizedText)) return false;

  // Invalid Devanagari matra positioning (matra starting a word standalone)
  if (/\b[\u093E-\u094C\u0901\u0902\u0903\u094D]/.test(normalizedText)) return false;

  // Multiple consecutive vowel matras
  if (/[\u093E-\u094C]{2,}/.test(normalizedText)) return false;

  const devanagariCount = (normalizedText.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (normalizedText.match(/[a-zA-Z]/g) || []).length;

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
