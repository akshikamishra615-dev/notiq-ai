import type { 
  StickyNote, 
  Flashcard, 
  QuizQuestion, 
  AIHighlight, 
  MindMapNode
} from '../types';

/**
 * Detect if text is primarily Hindi (Devanagari script) or English
 */
export function detectDocumentLanguage(text: string): 'hi' | 'en' {
  if (!text || text.trim().length === 0) return 'en';
  
  const devanagariMatches = text.match(/[\u0900-\u097F]/g) || [];
  const latinMatches = text.match(/[a-zA-Z]/g) || [];

  if (devanagariMatches.length > latinMatches.length * 0.2 || devanagariMatches.length > 20) {
    return 'hi';
  }
  return 'en';
}

/**
 * Comprehensive Educational Dictionary for fallback & offline terminology translation
 */
const EDUCATIONAL_DICTIONARY: Record<string, { hi: string; en: string }> = {
  'key concepts & overview': { hi: 'मुख्य अवधारणाएं एवं अवलोकन', en: 'Key Concepts & Overview' },
  'core insights': { hi: 'मुख्य अंतर्दृष्टि', en: 'Core Insights' },
  'summary': { hi: 'सारांश', en: 'Summary' },
  'important points': { hi: 'महत्वपूर्ण बिंदु', en: 'Important Points' },
  'high priority': { hi: 'उच्च प्राथमिकता', en: 'High Priority' },
  'medium priority': { hi: 'मध्यम प्राथमिकता', en: 'Medium Priority' },
  'low priority': { hi: 'निम्न प्राथमिकता', en: 'Low Priority' },
  'quantum superposition': { hi: 'क्वांटम सुपरपोजिशन (अध्यारोपण)', en: 'Quantum Superposition' },
  'quantum entanglement': { hi: 'क्वांटम उलझाव (Entanglement)', en: 'Quantum Entanglement' },
  'machine learning': { hi: 'मशीन लर्निंग (यंत्र अधिगम)', en: 'Machine Learning' },
  'neural network': { hi: 'तंत्रिका नेटवर्क (Neural Network)', en: 'Neural Network' },
  'artificial intelligence': { hi: 'कृत्रिम बुद्धिमत्ता (AI)', en: 'Artificial Intelligence' },
  'backpropagation': { hi: 'बैकप्रोपेगेशन (पश्चप्रसारण)', en: 'Backpropagation' },
  'superconductors': { hi: 'अतिचालक (Superconductors)', en: 'Superconductors' },
  'constitution of india': { hi: 'भारत का संविधान', en: 'Constitution of India' },
  'fundamental rights': { hi: 'मूल अधिकार (मौलिक अधिकार)', en: 'Fundamental Rights' },
  'directive principles': { hi: 'राज्य के नीति निर्देशक तत्व', en: 'Directive Principles' },
  'preamble': { hi: 'प्रस्तावना (उद्देशिका)', en: 'Preamble' },
  'freedom of speech': { hi: 'वाक् एवं अभिव्यक्ति की स्वतंत्रता', en: 'Freedom of Speech' },
  'drafting committee': { hi: 'प्रारूप समिति', en: 'Drafting Committee' },
  'indian national congress': { hi: 'भारतीय राष्ट्रीय कांग्रेस', en: 'Indian National Congress' },
};

/**
 * Translate a single string using multi-tier translation (Google GTX -> MyMemory -> Smart Fallback)
 */
export async function translateText(
  text: string, 
  targetLang: 'hi' | 'en', 
  sourceLang?: 'hi' | 'en'
): Promise<string> {
  if (!text || !text.trim()) return text;
  
  const src = sourceLang || (targetLang === 'hi' ? 'en' : 'hi');
  if (src === targetLang) return text;

  // SAFETY GUARD: If target language is Hindi, but text ALREADY contains Devanagari Hindi Unicode, DO NOT translate it!
  if (targetLang === 'hi' && /[\u0900-\u097F]/.test(text)) {
    return text;
  }

  const lower = text.trim().toLowerCase();
  if (EDUCATIONAL_DICTIONARY[lower]) {
    return EDUCATIONAL_DICTIONARY[lower][targetLang];
  }

  // Tier 1: Google Translate GTX Endpoint (Fast, highly accurate, sentence-level natural Hindi)
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
  } catch (e) {
    // Continue to tier 2
  }

  // Tier 2: MyMemory Translation API
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
        const cleanTranslated = translated
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
        return cleanTranslated;
      }
    }
  } catch (e) {
    console.warn('Online translation API unavailable/timed out, using smart context translator:', e);
  }

  return fallbackTranslate(text, targetLang);
}

/**
 * Smart Fallback Translation Engine for Offline/Network-Restricted Environments
 */
function fallbackTranslate(text: string, targetLang: 'hi' | 'en'): string {
  if (targetLang === 'hi') {
    let result = text;
    
    Object.entries(EDUCATIONAL_DICTIONARY).forEach(([enTerm, dict]) => {
      const regex = new RegExp(`\\b${enTerm}\\b`, 'gi');
      result = result.replace(regex, dict.hi);
    });

    result = result
      .replace(/\bis defined as\b/gi, 'को परिभाषित किया गया है')
      .replace(/\brefers to\b/gi, 'का तात्पर्य है')
      .replace(/\bis known as\b/gi, 'के रूप में जाना जाता है')
      .replace(/\bfor example\b/gi, 'उदाहरण के लिए')
      .replace(/\bkey takeaway\b/gi, 'मुख्य निष्कर्ष')
      .replace(/\bimportant note\b/gi, 'महत्वपूर्ण टिप्पणी')
      .replace(/\bthis section\b/gi, 'यह भाग')
      .replace(/\bincludes\b/gi, 'शामिल हैं')
      .replace(/\benables\b/gi, 'सक्षम बनाता है')
      .replace(/\bprovides\b/gi, 'प्रदान करता है')
      .replace(/\bhigh priority\b/gi, 'उच्च प्राथमिकता');

    return result;
  } else {
    let result = text;

    result = result
      .replace(/को परिभाषित किया गया है/g, 'is defined as')
      .replace(/का तात्पर्य है/g, 'refers to')
      .replace(/के रूप में जाना जाता है/g, 'is known as')
      .replace(/उदाहरण के लिए/g, 'for example')
      .replace(/महत्वपूर्ण बिंदु/g, 'important point')
      .replace(/मुख्य उद्देश्य/g, 'primary objective');

    return result;
  }
}

/**
 * Translate an array of strings in parallel
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en'
): Promise<string[]> {
  return Promise.all(texts.map(t => translateText(t, targetLang, sourceLang)));
}

/**
 * Translate all generated Sticky Notes into the target user language
 */
export async function translateStickyNotes(
  notes: StickyNote[],
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en',
  onProgress?: (progress: number, step: string) => void
): Promise<StickyNote[]> {
  if (notes.length === 0) return notes;
  if (onProgress) onProgress(60, `Translating sticky notes into ${targetLang === 'hi' ? 'Hindi (हिंदी)' : 'English'}...`);

  const translatedNotes: StickyNote[] = [];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const percentage = 60 + Math.round((i / notes.length) * 20);
    if (onProgress) onProgress(percentage, `Translating Note ${i + 1} of ${notes.length}...`);

    const translatedTitle = await translateText(note.title, targetLang, sourceLang);
    const translatedSummary = await translateText(note.summary, targetLang, sourceLang);
    const translatedBullets = await translateBatch(note.bullets, targetLang, sourceLang);
    const translatedKeywords = await translateBatch(note.keywords, targetLang, sourceLang);
    const translatedTopic = await translateText(note.topic, targetLang, sourceLang);

    translatedNotes.push({
      ...note,
      title: translatedTitle,
      summary: translatedSummary,
      bullets: translatedBullets,
      keywords: translatedKeywords,
      topic: translatedTopic,
    });
  }

  return translatedNotes;
}

/**
 * Translate Flashcards into target language
 */
export async function translateFlashcards(
  cards: Flashcard[],
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en'
): Promise<Flashcard[]> {
  return Promise.all(cards.map(async (c) => ({
    ...c,
    question: await translateText(c.question, targetLang, sourceLang),
    answer: await translateText(c.answer, targetLang, sourceLang),
    topic: await translateText(c.topic, targetLang, sourceLang),
  })));
}

/**
 * Translate Quiz Questions into target language
 */
export async function translateQuizQuestions(
  quiz: QuizQuestion[],
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en'
): Promise<QuizQuestion[]> {
  return Promise.all(quiz.map(async (q) => ({
    ...q,
    question: await translateText(q.question, targetLang, sourceLang),
    options: await translateBatch(q.options, targetLang, sourceLang),
    explanation: await translateText(q.explanation, targetLang, sourceLang),
    topic: await translateText(q.topic, targetLang, sourceLang),
  })));
}

/**
 * Translate AI Highlights into target language
 */
export async function translateHighlights(
  highlights: AIHighlight[],
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en'
): Promise<AIHighlight[]> {
  return Promise.all(highlights.map(async (h) => ({
    ...h,
    title: await translateText(h.title, targetLang, sourceLang),
    text: await translateText(h.text, targetLang, sourceLang),
  })));
}

/**
 * Translate Mind Map nodes into target language
 */
export async function translateMindMap(
  node: MindMapNode,
  targetLang: 'hi' | 'en',
  sourceLang?: 'hi' | 'en'
): Promise<MindMapNode> {
  const translatedLabel = await translateText(node.label, targetLang, sourceLang);
  let translatedChildren: MindMapNode[] | undefined;

  if (node.children && node.children.length > 0) {
    translatedChildren = await Promise.all(
      node.children.map(child => translateMindMap(child, targetLang, sourceLang))
    );
  }

  return {
    ...node,
    label: translatedLabel,
    children: translatedChildren,
  };
}
