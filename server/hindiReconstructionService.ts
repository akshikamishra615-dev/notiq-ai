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

    // Stage 1: Unicode Normalization (NFC)
    let text = rawText.normalize('NFC');

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

    // Common Devanagari conjunctions, postpositions, and auxiliary verbs splitting
    split = split
      .replace(/([\u0900-\u097F]{2,})(एवं|और|तथा|परंतु|लेकिन|क्योंकि)/g, '$1 $2')
      .replace(/([\u0900-\u097F]{2,})(ने|में|पर|से|को|का|की|के|लिए|तक|द्वारा)(?=[\s\.\,।\?\!]|$)/g, '$1 $2')
      .replace(/([\u0900-\u097F]{3,})(है|हैं|था|थे|थी|थीं|गया|गए|गई|दिया)(?=[\s\.\,।\?\!]|$)/g, '$1 $2')
      .replace(/\s*([।\,\?\!])\s*/g, '$1 ')
      .replace(/ {2,}/g, ' ');

    return split;
  }

  /**
   * Correct Hindi Spelling & Grammar Misreadings (e.g. किपता -> पिता, योिजतना -> जितना, मंिदर -> मंदिर)
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
