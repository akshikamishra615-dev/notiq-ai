/**
 * NOTIQ AI V52.0 - HindiReconstructionService
 * Comprehensive Backend Service for:
 * - OCR cleanup & Unicode NFC normalization
 * - Hindi matra & dotted circle repairs
 * - Word segmentation & merged words splitting
 * - Contextual Hindi grammar & NCERT sentence reconstruction
 */
export class HindiReconstructionService {
  /**
   * Complete Multi-Stage Hindi OCR Reconstruction Pipeline
   */
  public static reconstruct(rawText: string): string {
    if (!rawText) return '';

    // SAFEGUARD: If text ALREADY contains valid Devanagari Unicode, DO NOT run Kruti Dev conversion or destructive word chopping!
    if (/[\u0900-\u097F]/.test(rawText)) {
      return this.cleanOCRCodes(this.repairMatrasAndDottedCircles(rawText.normalize('NFC'))).trim();
    }

    // Stage 0: Kruti Dev / DevLys Legacy Font Conversion (ONLY for non-Unicode text)
    let text = this.convertKrutiDevToUnicode(rawText);

    // Stage 1: Unicode Normalization (NFC)
    text = text.normalize('NFC');

    // Stage 2: Remove OCR Garbage Codes & UTF Artifacts
    text = this.cleanOCRCodes(text);

    // Stage 3: Repair Dotted Circles & Misplaced Matras
    text = this.repairMatrasAndDottedCircles(text);

    // Stage 4: Split Merged Hindi Words
    text = this.splitMergedHindiWords(text);

    // Stage 5: Grammar & Spelling Repair
    text = this.repairGrammarAndSpelling(text);

    return text.normalize('NFC').trim();
  }

  /**
   * Remove OCR Artifact Codes, Zero-Width Spaces, and Broken Characters
   */
  public static cleanOCRCodes(text: string): string {
    const ocrCodesPattern = /\b(UXV|UXK|UXJ|QWX|PLM|XZY|ZXC|VBN|FGH|JKL|WER|TYU|IOP|ASD|GHJ|KLZ|XCV|BNM|KZHUUQ|KRUVSKTZ|USSOZZKK)\b/gi;

    return text
      .replace(ocrCodesPattern, '')
      .replace(/[\u25CC\u25CB\u25EF◌]/g, '')  // Dotted circles
      .replace(/\uFFFD/g, '')                  // Unicode replacement character
      .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero width characters
      .replace(/[\*\#\`\~\_\^\<\>]+/g, '')    // Decorative characters
      .replace(/ {2,}/g, ' ');
  }

  /**
   * Repair Dotted Circles & Attach Orphaned Matras
   */
  public static repairMatrasAndDottedCircles(text: string): string {
    let cleaned = text;

    const dottedCircleReplacements: [RegExp, string][] = [
      [/मं[\u25CC\u25CB\u25EF◌]दिर/g, "मंदिर"],
      [/प[\u25CC\u25CB\u25EF◌]ेज/g, "पेज"],
      [/वि[\u25CC\u25CB\u25EF◌]द्यालय/g, "विद्यालय"],
      [/रा[\u25CC\u25CB\u25EF◌]ष्ट्रीय/g, "राष्ट्रीय"],
      [/कि[\u25CC\u25CB\u25EF◌]पता/g, "पिता"],
      [/ब[\u25CC\u25CB\u25EF◌]च्चे/g, "बच्चे"],
      [/ग[\u25CC\u25CB\u25EF◌]तिविधि/g, "गतिविधि"],
      [/[\u25CC\u25CB\u25EF◌]+/g, ""],
    ];

    for (const [pattern, replacement] of dottedCircleReplacements) {
      cleaned = cleaned.replace(pattern, replacement);
    }

    // Attach orphaned Devanagari vowel signs to preceding consonant
    cleaned = cleaned.replace(/([\u0900-\u097F])\s+([\u093E-\u094C\u0901\u0902\u0903\u094D])/g, '$1$2');

    return cleaned;
  }

  /**
   * Split Merged Hindi Words (e.g. कार्यप्रणालीएवंसंरचना -> कार्यप्रणाली एवं संरचना)
   */
  public static splitMergedHindiWords(text: string): string {
    let split = text;

    const specificMergedPhrases: [RegExp, string][] = [
      [/कार्यप्रणालीएवंसंरचना/g, "कार्यप्रणाली एवं संरचना"],
      [/कार्यप्रणालीएवं/g, "कार्यप्रणाली एवं"],
      [/गाँवकीआबादी/g, "गाँव की आबादी"],
      [/लोगोंने/g, "लोगों ने"],
      [/मंदिरकाविस्तार/g, "मंदिर का विस्तार"],
      [/अपनेकंधोंपर/g, "अपने कंधों पर"],
      [/पूजापाठ/g, "पूजा-पाठ"],
      [/मुख्यगुण/g, "मुख्य गुण"],
      [/लड़कीयहीं/g, "लड़की यहीं"],
      [/गढ़वालीलोककथा/g, "गढ़वाली लोककथा"],
      [/अपनेवंधोपरबैठाकर/g, "अपने कंधों पर बैठाकर"],
      [/परिचयदिया/g, "परिचय दिया"],
      [/तरीकेसे/g, "तरीके से"],
      [/भाषामें/g, "भाषा में"],
      [/दृष्टिसे/g, "दृष्टि से"],
      [/भागमहत्वपूर्ण/g, "भाग महत्वपूर्ण"],
      [/करतेथे/g, "करते थे"],
      [/बतातीथीं/g, "बताती थीं"],
      [/रहतेथे/g, "रहते थे"],
      [/दियागया/g, "दिया गया"],
      [/प्रस्तुतकिया/g, "प्रस्तुत किया"],
      [/समझायाहै/g, "समझाया है"],
    ];

    for (const [pattern, replacement] of specificMergedPhrases) {
      split = split.replace(pattern, replacement);
    }

    return split.replace(/\s*([।\,\?\!])\s*/g, '$1 ').replace(/ {2,}/g, ' ');
  }

  /**
   * Correct Hindi Spelling & Grammar Misreadings
   */
  public static repairGrammarAndSpelling(text: string): string {
    let repaired = text;

    const commonSpellingFixes: [RegExp, string][] = [
      [/\bकिपता\b/g, "पिता"],
      [/\bयोिजतना\b/g, "जितना"],
      [/\bकोिजतना\b/g, "को जितना"],
      [/\bमंिदर\b/g, "मंदिर"],
      [/\bिवद्यालय\b/g, "विद्यालय"],
      [/\bरा्ष्ट्र\b/g, "राष्ट्र"],
      [/\bरा्ष्ट्रीय\b/g, "राष्ट्रीय"],
      [/\bअाबादी\b/g, "आबादी"],
      [/\bिवतार\b/g, "विस्तार"],
      [/\bलोों\b/g, "लोगों"],
      [/\bलोगो\b/g, "लोगों"],
      [/\bहिरहर\b/g, "हरिहर"],
      [/\bपडोस\b/g, "पड़ोस"],
      [/\bवंधो\b/g, "कंधों"],
      [/\bकधों\b/g, "कंधों"],
      [/\bअौर\b/g, "और"],
      [/\bकार\.ा\b/g, "कारण"],
      [/\bकारणा\b/g, "कारण"],
      [/\bिदल\b/g, "दिल"],
      [/\bिदन\b/g, "दिन"],
      [/\bिसर्फ\b/g, "सिर्फ"],
      [/\bविदयार्थी\b/g, "विद्यार्थी"],
      [/\bपाठयक्रम\b/g, "पाठ्यक्रम"],
      [/\bपाठयचर्या\b/g, "पाठ्यचर्या"],
      [/\bगतििवधि\b/g, "गतिविधि"],
      [/\bअनुभवो\b/g, "अनुभवों"],
      [/\bशिक्षको\b/g, "शिक्षकों"],
      [/\bकक्षाओ\b/g, "कक्षाओं"],
      [/\bकिताबो\b/g, "किताबों"],
      [/\bबच्चो\b/g, "बच्चों"],
      [/\bगाँव\b/g, "गांव"],
    ];

    for (const [pattern, replacement] of commonSpellingFixes) {
      repaired = repaired.replace(pattern, replacement);
    }

    return repaired;
  }

  /**
   * Detect & convert legacy Kruti Dev / DevLys / Chanakya font text into standard Devanagari Unicode
   */
  /**
   * Detect & convert legacy Kruti Dev / DevLys / Chanakya font text into standard Devanagari Unicode
   */
  public static convertKrutiDevToUnicode(text: string): string {
    if (!text) return '';

    // Guard 1: Direct Unicode Hindi without legacy font signatures
    if (/[\u0900-\u097F]/.test(text) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(text)) {
      if (/[a-zA-Z]/.test(text)) {
        return text.split(/(\s+)/).map(token => {
          if (/[\u0900-\u097F]/.test(token)) return token;
          if (/^[a-zA-Z0-9.,!?'"()-]+$/.test(token) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(token)) {
            return token;
          }
          return HindiReconstructionService.convertKrutiDevToUnicode(token);
        }).join('');
      }
      return text.normalize('NFC').replace(/एे/g, 'ऐ');
    }

    // Guard 2: Plain English without legacy font signature
    if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text) && !/\b(flYoj|oSfMax|fQYe|vè;k;|dkgkuh|fl¼kUr|EkgÙoiw|vkfl|okbZ|kQkby|iQhrk|lsDku)\b/.test(text)) {
      return text;
    }

    let str = text;

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

      ['dkgkuh', 'कहानी'],
      ['fl¼kUr', 'सिद्धांत'],
      ['EkgÙoiw', 'महत्वपूर्'],
    ];

    for (const [pattern, replacement] of ligatures) {
      str = str.split(pattern).join(replacement);
    }

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

    str = str.replace(/([क-ह](?:्[क-ह])?[\u093E-\u094C\u0901\u0902\u0903]*)Z/g, 'र्$1');
    str = str.replace(/Z/g, 'र्');

    str = str
      .replace(/दफ़्र तर/g, 'दफ़्तर')
      .replace(/फ़ि़/g, 'फ़ि')
      .replace(/फ़्ि/g, 'फ़ि')
      .replace(/एे/g, 'ऐ')
      .replace(/बॉध/g, 'बांध')
      .replace(/पॉch/g, 'पांच')
      .replace(/वैडंिग/g, 'वैडिंग')
      .replace(/([क-ह]्)\s+/g, '$1')
      .replace(/([\u0900-\u097F])\s+([\u093E-\u094C\u0901\u0902\u0903\u094D])/g, '$1$2')
      .replace(/\s+/g, ' ')
      .trim();

    return str.normalize('NFC');
  }

  /**
   * Validate whether a string is clean Devanagari without OCR artifacts
   */
  public static validateHindiResponse(text: string): boolean {
    if (!text) return true;
    const hasDottedCircle = /[\u25CC\u25CB\u25EF◌]/.test(text);
    const hasReplacementChar = /\uFFFD/.test(text);
    const hasOcrArtifact = /\b(UXV|UXK|UXJ|QWX|PLM|XZY|ZXC|VBN|FGH|JKL|WER|TYU|IOP|ASD|GHJ|KLZ|XCV|BNM)\b/i.test(text);

    return !hasDottedCircle && !hasReplacementChar && !hasOcrArtifact;
  }
}
