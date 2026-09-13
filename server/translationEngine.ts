/**
 * NOTIQ AI V52.0 - Backend Translation Engine
 * Multi-tier natural semantic translation (Google GTX + MyMemory + Educational Dictionary fallback)
 */
export class BackendTranslationEngine {
  private static readonly DICTIONARY: Record<string, { hi: string; en: string }> = {
    'key concepts & overview': { hi: 'मुख्य अवधारणाएं एवं अवलोकन', en: 'Key Concepts & Overview' },
    'core insights': { hi: 'मुख्य अंतर्दृष्टि', en: 'Core Insights' },
    'summary': { hi: 'सारांश', en: 'Summary' },
    'important points': { hi: 'महत्वपूर्ण बिंदु', en: 'Important Points' },
    'chapter overview': { hi: 'अध्याय का परिचय', en: 'Chapter Overview' },
    'quick revision': { hi: 'त्वरित रिवीजन', en: 'Quick Revision' },
    'easy explanation': { hi: 'सरल भाषा में समझें', en: 'Easy Explanation' },
    'conclusion': { hi: 'निष्कर्ष', en: 'Conclusion' },
  };

  /**
   * Translate text semantically
   */
  public static async translate(text: string, targetLang: 'hi' | 'en', sourceLang?: 'hi' | 'en'): Promise<string> {
    if (!text || !text.trim()) return text;

    const src = sourceLang || (targetLang === 'hi' ? 'en' : 'hi');
    if (src === targetLang) return text;

    const lower = text.trim().toLowerCase();
    if (this.DICTIONARY[lower]) {
      return this.DICTIONARY[lower][targetLang];
    }

    // Tier 1: Google GTX Endpoint (Sentence-level, high quality)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(gtxUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const fullTranslation = data[0]
            .map((item: any) => (item && typeof item[0] === 'string' ? item[0] : ''))
            .join('')
            .trim();

          if (fullTranslation.length > 0) {
            return fullTranslation
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&');
          }
        }
      }
    } catch {
      // Continue to tier 2
    }

    // Tier 2: MyMemory API Fallback
    try {
      const langPair = `${src}|${targetLang}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data?.responseData?.translatedText;
        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          return translated
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
        }
      }
    } catch {
      // Continue to fallback
    }

    return text;
  }
}
