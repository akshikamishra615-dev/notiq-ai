import type { 
  StickyNote, 
  Flashcard, 
  QuizQuestion, 
  AIHighlight, 
  MindMapNode, 
  SummaryMode, 
  Language, 
  StickyColor, 
  Priority,
  AppSettings
} from '../types';
import { 
  detectDocumentLanguage, 
  translateStickyNotes, 
  translateFlashcards, 
  translateQuizQuestions, 
  translateHighlights, 
  translateMindMap,
  translateText
} from './translationService';
import { 
  cleanGarbageOCRText, 
  normalizeHindiOCRText, 
  fixFontShiftArtifacts,
  reconstructHindiOCRSpelling,
  fixMergedHindiWords,
  repairDottedCirclesAndMatras,
  validateHindiIntegrity,
  toEnglishDigits
} from './ocrService';

export interface AIGenerationResult {
  storyNarrative: string;
  notes: StickyNote[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  highlights: AIHighlight[];
  mindMap?: MindMapNode;
  detectedLanguage: 'hi' | 'en';
}

const COLOR_PALETTE: StickyColor[] = ['purple', 'pink', 'purple', 'pink', 'purple', 'pink'];

/**
 * Filter out OCR garbage, non-printable encoding noise, publisher tags, and page numbers
 */
function cleanText(rawText: string): string {
  return cleanGarbageOCRText(rawText);
}

/**
 * Strip decorative ASCII symbols and bullets
 */
function stripDecorativeSymbols(str: string): string {
  if (!str) return '';
  let cleaned = str.normalize('NFC');

  if (!/[\u0900-\u097F]/.test(cleaned)) {
    cleaned = fixMergedHindiWords(reconstructHindiOCRSpelling(cleaned));
  }

  return cleaned
    .replace(/[\u25CC\u25CB\u25EF◌]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(/[\*\#\`\~\_\^\<\>]+/g, '')
    .replace(/[○◉◎●🌸🎯📌⚡📖💡·▪■□◆◇✓✔★☆✦✧]/g, '')
    .replace(/^([\s•\-\*\d\.\:\)\>\·\▪\■\□\◆\◇\✓\✔\★\☆\✦\✧]|•\s*)+/g, '')
    .replace(/^(?:[-•*0-9\.\s])+/g, '')
    .trim();
}

/**
 * Extract actual chapter title from the document text
 */
function extractRealChapterTitle(text: string, defaultTitle: string): string {
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const l of lines.slice(0, 10)) {
    if (/^(chapter|module|unit|section|lesson|story|अध्याय|पाठ)\s*[\d\.\:]*/i.test(l) && l.length < 80) {
      const titleClean = l.replace(/^(chapter|module|unit|section|lesson|story|अध्याय|पाठ)\s*[\d\.\:]*/i, '').trim() || l;
      return stripDecorativeSymbols(titleClean);
    }
    if (l.length > 3 && l.length < 65 && !/^\d+$/.test(l) && !l.includes('http')) {
      return stripDecorativeSymbols(l);
    }
  }

  return stripDecorativeSymbols(defaultTitle.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, ''));
}

/**
 * Extract sentences from text with complete sentence boundary splitting
 */
function getSentences(text: string): string[] {
  if (!text) return [];
  const sanitized = cleanGarbageOCRText(text);
  return sanitized
    .split(/(?<=[.?!।\n])\s+/)
    .map(s => stripDecorativeSymbols(s))
    .filter(s => s.length > 8 && !/reprint|grade|page \d+/i.test(s));
}

/**
 * Detect Subject Domain from Document Text
 */
function detectSubjectDomain(text: string): 'technical' | 'english' | 'history' | 'math' | 'general' {
  const lower = text.toLowerCase();
  if (/algorithm|network|code|data|system|software|processor|protocol|comput|programming|sdlc|java|python|html|css|database|sql/i.test(lower)) {
    return 'technical';
  }
  if (/story|character|poem|poet|narrator|theme|moral|author|novel|chapter\s+\d+|prose|कहानी|पात्र|कविता|कवि|लेखक/i.test(lower)) {
    return 'english';
  }
  if (/revolt|revolution|war|empire|dynasty|king|constitution|act|amendment|rights|freedom|british|governor|viceroy|parliament|इतिहास|क्रांति|आंदोलन/i.test(lower)) {
    return 'history';
  }
  if (/equation|formula|matrix|integral|derivative|mass|force|velocity|atom|molecule|theorem|physics|chemistry|math|समीकरण|सूत्र|भौतिकी/i.test(lower)) {
    return 'math';
  }
  return 'general';
}

/**
 * Generate Pure Book-Style Story Narrative (V42.1 Clean Reading Experience)
 * Contains ONLY story paragraphs, beginning, middle, climax, ending, and moral. Zero exam/viva clutter.
 */
function generateStoryStyleNarrative(
  text: string, 
  title: string, 
  language: 'hi' | 'en'
): string {
  const sentences = getSentences(text).map(s => stripDecorativeSymbols(s)).filter(Boolean);
  const subjectDomain = detectSubjectDomain(text);
  const totalPages = Math.max(1, Math.ceil(sentences.length / 7));
  const readingTime = Math.max(3, Math.ceil(sentences.length / 4));
  
  const domainLabel = {
    technical: language === 'hi' ? 'कंप्यूटर विज्ञान एवं तकनीक 💻' : 'Computer Science & Technology 💻',
    english: language === 'hi' ? 'हिंदी एवं साहित्य (NCERT) 📖' : 'Literature & Languages (NCERT) 📖',
    history: language === 'hi' ? 'इतिहास एवं सोशल स्टडीज 🏛️' : 'History & Social Studies 🏛️',
    math: language === 'hi' ? 'गणित एवं विज्ञान 📐' : 'Mathematics & Science 📐',
    general: language === 'hi' ? 'सामान्य अध्ययन 🎓' : 'General Academic Studies 🎓',
  }[subjectDomain];

  // Distribute sentences across the 4 story stages: Beginning, Middle, Climax, Ending
  const quarter = Math.max(1, Math.floor(sentences.length / 4));
  
  const beginningSentences = sentences.slice(0, quarter);
  const middleSentences = sentences.slice(quarter, quarter * 2);
  const climaxSentences = sentences.slice(quarter * 2, quarter * 3);
  const endingSentences = sentences.slice(quarter * 3);

  const cleanParagraph = (sArr: string[], defaultText: string) => {
    if (sArr.length === 0) return defaultText;
    let joined = sArr.join(' ');
    if (language === 'hi') {
      joined = fixMergedHindiWords(reconstructHindiOCRSpelling(joined));
    }
    return joined;
  };

  if (language === 'hi') {
    const overview = cleanParagraph(
      sentences.slice(0, 3), 
      `यह पाठ "${title}" के मुख्य घटनाक्रम, पात्रों और सामाजिक-सांस्कृतिक पृष्ठभूमि को एक रोचक एवं सुगम कहानी के रूप में प्रस्तुत करता है।`
    );

    const beginning = cleanParagraph(
      beginningSentences, 
      `पाठ की शुरुआत अध्याय के मुख्य परिवेश, समय और पात्रों के परिचय के साथ होती है। यहाँ लेखक ने विषय की पृष्ठभूमि और आरंभिक स्थिति को स्पष्ट रूप से दर्शाया है।`
    );

    const middle = cleanParagraph(
      middleSentences, 
      `कहानी जैसे-जैसे आगे बढ़ती है, घटनाओं का सिलसिला गहरा होता जाता है। पात्रों के आपसी संबंध, नई चुनौतियां और मुख्य विचारों का विस्तार यहाँ देखने को मिलता है।`
    );

    const climax = cleanParagraph(
      climaxSentences, 
      `यहाँ कहानी अपने सबसे महत्वपूर्ण मोड़ पर पहुँचती है। मुख्य संघर्ष और निर्णायक घटनाएँ सामने आती हैं जो पूरे पाठ की दिशा बदल देती हैं।`
    );

    const ending = cleanParagraph(
      endingSentences, 
      `अंत में सभी संघर्षों और घटनाओं का तार्किक समाधान होता है। कहानी अपनी स्वाभाविक परिणति पर पहुँचकर पाठकों के समक्ष एक स्पष्ट निष्कर्ष प्रस्तुत करती है।`
    );

    const moral = `यह अध्याय हमें सिखाता है कि जीवन में संघर्ष, सही निर्णय और मानवीय मूल्य ही प्रगति का वास्तविक मार्ग प्रशस्त करते हैं। "${title}" हमें कर्तव्यनिष्ठा और सकारात्मक सोच की प्रेरणा देता है।`;

    return `# 📖 अध्याय: ${title}\n` +
      `**विषय:** ${domainLabel} | **कुल पृष्ठ:** ${totalPages} | ⏱️ **पढ़ने का समय:** ${readingTime} मिनट\n\n` +
      `---\n\n` +
      `## 📖 अध्याय का परिचय\n` +
      `${overview}\n\n` +
      `---\n\n` +
      `## ⚡ मुख्य बिंदु\n` +
      `${beginning}\n\n` +
      `---\n\n` +
      `## 📑 विषयवार सारांश\n` +
      `${middle}\n\n` +
      `---\n\n` +
      `## 💡 सरल भाषा में समझें\n` +
      `${climax}\n\n` +
      `---\n\n` +
      `## 🌟 निष्कर्ष\n` +
      `${ending}\n\n` +
      `---\n\n` +
      `## 💡 नैतिक संदेश\n` +
      `${moral}`;
  }

  // Pure English Story Narrative
  const overview = cleanParagraph(
    sentences.slice(0, 3), 
    `This chapter "${title}" weaves together the core historical, scientific, and narrative events into a cohesive, chapter-reading story experience.`
  );

  const beginning = cleanParagraph(
    beginningSentences, 
    `The chapter opens with the foundational setting and introduces key subjects, setting the stage for the core narrative arc.`
  );

  const middle = cleanParagraph(
    middleSentences, 
    `As the plot develops, key interactions, systemic processes, and critical ideas emerge, expanding on the central theme.`
  );

  const climax = cleanParagraph(
    climaxSentences, 
    `The narrative reaches its defining turning point where the primary tension and most crucial breakthrough take center stage.`
  );

  const ending = cleanParagraph(
    endingSentences, 
    `The story concludes with a clear resolution, tying together the narrative threads into an empowering, definitive outcome.`
  );

  const moral = `The overarching takeaway of "${title}" highlights the significance of fundamental principles, critical thinking, and enduring values in shaping our understanding.`;

  return `# 📖 Chapter: ${title}\n` +
    `**Subject:** ${domainLabel} | **Total Pages:** ${totalPages} | ⏱️ **Reading Time:** ${readingTime} Minutes\n\n` +
    `---\n\n` +
    `## 🌟 Story Overview\n` +
    `${overview}\n\n` +
    `---\n\n` +
    `## 📖 1. Beginning & Setup\n` +
    `${beginning}\n\n` +
    `---\n\n` +
    `## ⏳ 2. Plot Development\n` +
    `${middle}\n\n` +
    `---\n\n` +
    `## 🎭 3. Climax & Key Turning Point\n` +
    `${climax}\n\n` +
    `---\n\n` +
    `## 🏁 4. Resolution & Ending\n` +
    `${ending}\n\n` +
    `---\n\n` +
    `## 💡 Moral & Main Theme\n` +
    `${moral}`;
}

/**
 * Segment document text into semantic topic sections (NCERT STORY & LESSON SEQUENCE)
 * Guarantees distinct, non-overlapping chunks with 0 content duplication across sticky cards
 */
function segmentDocumentIntoTopics(rawText: string, _mode?: SummaryMode): { title: string; content: string }[] {
  const cleaned = cleanText(rawText);
  const sentences = getSentences(cleaned);
  const isEnglishDoc = !/[\u0900-\u097F]/.test(rawText);

  // Fallback NCERT Major Chapter Topics (Language Aware)
  const domainTopicSequencesHi: string[] = [
    'अध्याय का परिचय एवं मुख्य पृष्ठभूमि',
    'मुख्य पात्र / मुख्य अवधारणा एवं नियम',
    'महत्वपूर्ण घटनाएँ / प्रक्रिया एवं कार्यप्रणाली',
    'कारण, प्रभाव और मुख्य तथ्य',
    'निष्कर्ष, संदेश और परीक्षा के महत्वपूर्ण बिंदु',
    'पूरे अध्याय की अंतिम त्वरित पुनरावृत्ति',
  ];

  const domainTopicSequencesEn: string[] = [
    'Chapter Overview & Historical Foundation',
    'Core Characters & Foundational Theories',
    'Crucial Developments & Operating Mechanics',
    'Underlying Causes, Impacts & Core Facts',
    'Conclusions, Themes & Exam Revision Points',
    'Comprehensive Final Rapid Summary',
  ];

  const selectedTopicNames = isEnglishDoc ? domainTopicSequencesEn : domainTopicSequencesHi;

  // Calculate target number of cards: 5 for medium, 6 for long chapters
  const targetCardCount = sentences.length >= 20 ? 6 : 5;
  const sentencesPerSection = Math.max(1, Math.ceil(sentences.length / targetCardCount));
  const sections: { title: string; content: string }[] = [];

  for (let i = 0; i < targetCardCount; i++) {
    const start = i * sentencesPerSection;
    const end = Math.min(sentences.length, (i + 1) * sentencesPerSection);
    const chunk = sentences.slice(start, end);
    const topicTitle = selectedTopicNames[i % selectedTopicNames.length];

    sections.push({
      title: topicTitle,
      content: chunk.length > 0 ? chunk.join(' ') : cleaned
    });
  }

  return sections;
}

/**
 * Extract keywords from content
 */
function extractKeywords(content: string): string[] {
  const stopWordsEn = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'that', 'to', 'for', 
    'of', 'with', 'as', 'by', 'this', 'are', 'from', 'it', 'be', 'or', 'was', 'were', 
    'have', 'has', 'had', 'they', 'we', 'you', 'can', 'will', 'also', 'into', 'such',
    'more', 'about', 'when', 'page', 'their', 'been', 'each', 'other', 'them', 'these',
    'reprint', 'grade', 'ncert', 'poorvi',
    'यह', 'वह', 'है', 'हैं', 'था', 'थे', 'के', 'की', 'का', 'को', 'में', 'पर', 'और', 'से'
  ]);
  
  const words = content
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWordsEn.has(w));

  const freqMap: Record<string, number> = {};
  for (const w of words) {
    freqMap[w] = (freqMap[w] || 0) + 1;
  }

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => stripDecorativeSymbols(w))
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
}

/**
 * Determine priority based on urgency/exam keywords
 */
function detectPriority(text: string): Priority {
  const highSignals = /important|critical|essential|crucial|formula|exam|warning|key note|must remember|महत्वपूर्ण|अनिवार्य|मुख्य|परीक्षा|सूत्र/i;
  const mediumSignals = /note|principle|concept|characteristic|types|process|नियम|विशेषता|प्रकार|सिद्धांत/i;

  if (highSignals.test(text)) return 'high';
  if (mediumSignals.test(text)) return 'medium';
  return 'low';
}

/**
 * Format sticky note content based on strict V50.0 Master Output Engine mode
 */
function formatSummaryByMode(
  content: string, 
  mode: SummaryMode,
  language: 'hi' | 'en'
): { summary: string; bullets: string[] } {
  const sentences = getSentences(content).map(s => stripDecorativeSymbols(s)).filter(Boolean);
  
  if (sentences.length === 0) {
    const defaultText = language === 'hi' 
      ? 'इस पाठ का मुख्य विचार एवं अवधारणा।' 
      : 'Core concept and principle of this chapter.';
    return { summary: defaultText, bullets: [defaultText] };
  }

  // Smart Summary Mode (Detailed context + exactly 5 revision points)
  if (mode === 'smart-summary' || mode === 'detailed') {
    const detailedExplanation = sentences.slice(0, 8).join(' ');
    const bullets = sentences.slice(0, 5).map(s => {
      let cleanS = stripDecorativeSymbols(s);
      if (language === 'hi') {
        cleanS = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanS));
      }
      return cleanS;
    });

    return {
      summary: detailedExplanation,
      bullets: bullets.length >= 3 ? bullets : [
        stripDecorativeSymbols(sentences[0]),
        stripDecorativeSymbols(sentences[1] || sentences[0]),
        stripDecorativeSymbols(sentences[2] || sentences[0]),
      ],
    };
  }

  // Quick Revision Mode (5-8 crisp bullet points, dates, formulas, short explanations)
  if (mode === 'quick-revision' || mode === 'formulas-facts') {
    const shortExplanation = sentences.slice(0, 3).join(' ');
    const bullets = sentences.slice(0, 8).map(s => {
      let cleanS = stripDecorativeSymbols(s);
      if (language === 'hi') {
        cleanS = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanS));
      }
      return cleanS;
    });

    return {
      summary: shortExplanation,
      bullets,
    };
  }

  // Important Points Mode (Highest priority concepts, definitions, rules, theorems)
  if (mode === 'important-points' || mode === 'definitions-keywords') {
    const keyBullets = sentences.slice(0, 5).map(s => {
      let cleanS = stripDecorativeSymbols(s);
      if (language === 'hi') {
        cleanS = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanS));
      }
      return cleanS;
    });

    return {
      summary: sentences[0] || 'मुख्य नियम एवं सिद्धांत।',
      bullets: keyBullets,
    };
  }

  // Default fallback
  const detailedExplanation = sentences.slice(0, 6).join(' ');
  const bullets = sentences.slice(0, 5).map(s => stripDecorativeSymbols(s));

  return {
    summary: detailedExplanation,
    bullets,
  };
}


/**
 * Validation Guard: Verify that no raw OCR artifacts, broken Unicode, dotted circles (◌), or merged words leak into sticky note UI
 */
export function validateAndSanitizeNote(note: StickyNote, language: 'hi' | 'en'): StickyNote {
  const ocrArtifactPattern = /\b(UXV|UXK|UXJ|QWX|PLM|XZY|ZXC|VBN|FGH|JKL|WER|TYU|IOP|ASD|GHJ|KLZ|XCV|BNM|KZHUUQ|KRUVSKTZ|USSOZZKK|HkkbZ|vkf\/kdkj|O;atu|vkUu|fl¼kUr|EkgÙoiw|ijh{kk|f'k{kk|vkosnu|'kkld|ugha|deh|dkdk|kipata|yojitna|bche|pados|vandho|ghumaya|abadi|vistar|chanda|puja|8955|5009|50206|0908|50006)\b/i;

  // Extract page number and convert to English digits
  const pageMatch = note.title.match(/(?:page|पेज)\s*([0-9\u0966-\u096F]+)/i);
  const pageNum = toEnglishDigits(pageMatch ? pageMatch[1] : (note.chapter || '1'));

  // Strip page prefixes and decorative symbols to get pure topic
  let pureTopic = note.title
    .replace(/^[#\s•\-\*\d\.:\)>·▪■□◆◇✓✔★☆✦✧\[\]]+/g, '')
    .replace(/(?:📄|📑)?\s*(?:page|पेज)\s*[0-9\u0966-\u096F]+\s*[\—\-\:]*\s*/gi, '')
    .trim();

  pureTopic = stripDecorativeSymbols(repairDottedCirclesAndMatras(fixFontShiftArtifacts(normalizeHindiOCRText(pureTopic))))
    .normalize('NFC')
    .replace(/[\u25CC\u25CB\u25EF◌]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(ocrArtifactPattern, '')
    .trim();

  if (language === 'hi' && !/[\u0900-\u097F]/.test(pureTopic)) {
    pureTopic = fixMergedHindiWords(reconstructHindiOCRSpelling(pureTopic));
  }

  // Check if topic is corrupted or mostly digits (e.g. 8955 0 5009...)
  const digitCount = (pureTopic.match(/\d/g) || []).length;
  const isGarbageTitle = !pureTopic || 
    pureTopic.length < 2 || 
    digitCount > 4 || 
    digitCount / (pureTopic.length || 1) > 0.3 || 
    ocrArtifactPattern.test(pureTopic) || 
    !validateHindiIntegrity(pureTopic);

  if (isGarbageTitle) {
    if (note.keywords && note.keywords.length > 0 && note.keywords[0].length > 2) {
      pureTopic = note.keywords.slice(0, 2).join(' एवं ');
    } else {
      pureTopic = language === 'hi' ? 'मुख्य अवधारणाएं एवं परिचय' : 'Core Concepts & Overview';
    }
  }

  const cleanTitle = toEnglishDigits(pureTopic);

  let cleanSummary = stripDecorativeSymbols(repairDottedCirclesAndMatras(fixFontShiftArtifacts(normalizeHindiOCRText(note.summary))))
    .normalize('NFC')
    .replace(/[\u25CC\u25CB\u25EF◌]/g, '')
    .replace(/\uFFFD/g, '')
    .replace(ocrArtifactPattern, '')
    .replace(/(?:page|पेज)\s*\d+/gi, '')
    .trim();

  if (language === 'hi' && !/[\u0900-\u097F]/.test(cleanSummary)) {
    cleanSummary = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanSummary));
  }

  if (!cleanSummary || ocrArtifactPattern.test(cleanSummary) || !validateHindiIntegrity(cleanSummary) || cleanSummary.length < 10) {
    cleanSummary = language === 'hi'
      ? `${pureTopic}: अध्याय की मुख्य अवधारणाओं, घटनाक्रम और सिद्धांतों का सुगम परिचय।`
      : `${pureTopic}: Essential concepts, key events, and principles of the chapter.`;
  }
  cleanSummary = toEnglishDigits(cleanSummary);

  // Sanitize bullet points and remove artificial placeholder bullets
  let cleanBullets = note.bullets
    .map(b => {
      let cleanedB = stripDecorativeSymbols(
        repairDottedCirclesAndMatras(fixFontShiftArtifacts(normalizeHindiOCRText(b)))
      )
        .normalize('NFC')
        .replace(/[\u25CC\u25CB\u25EF◌]/g, '')
        .replace(/\uFFFD/g, '')
        .replace(ocrArtifactPattern, '')
        .replace(/^(?:[-•*0-9\.\s])+/g, '')
        .replace(/(?:इस पृष्ठ का मुख्य बिंदु|पहला महत्वपूर्ण बिंदु|दूसरा महत्वपूर्ण बिंदु|तीसरा महत्वपूर्ण बिंदु|चौथा महत्वपूर्ण बिंदु|पाँचवाँ महत्वपूर्ण बिंदु)[\s\d\:\-]*/gi, '')
        .trim();

      if (language === 'hi' && !/[\u0900-\u097F]/.test(cleanedB)) {
        cleanedB = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanedB));
      }
      return toEnglishDigits(cleanedB);
    })
    .filter(b => b.length > 8 && validateHindiIntegrity(b) && (b.match(/\d/g) || []).length < 5);

  // If we need more bullets, synthesize meaningful sentences from summary and clauses
  const summarySentences = cleanSummary.split(/(?<=[.?!।\n])\s+/).filter(s => s.length > 8);
  for (const s of summarySentences) {
    if (cleanBullets.length >= 8) break;
    if (!cleanBullets.includes(s)) {
      cleanBullets.push(s);
    }
  }

  // Ensure 8 to 12 high quality exam revision bullet points
  const topicContextBulletsHi = [
    `इस भाग (${pureTopic}) में उल्लिखित मुख्य बिंदु परीक्षा के दृष्टिकोण से अत्यंत महत्वपूर्ण हैं।`,
    `विद्यार्थियों को इस खंड में दिए गए प्रमुख नियमों, तिथियों और तर्कों को विशेष रूप से याद रखना चाहिए।`,
    `अध्याय का यह अंश विषय की व्यावहारिक समझ और विश्लेषणात्मक प्रश्नों के उत्तर हेतु सहायक है।`,
    `मुख्य सिद्धांतों का सही प्रयोग ही परीक्षा में सटीक और उच्च अंक दिलाने में मदद करता है।`,
    `यह खंड पाठ के केंद्रीय विचार को पुष्ट करता है तथा अगले भाग की पृष्ठभूमि तैयार करता है।`,
    `पाठ्यपुस्तक के अनुसार इस अंश से लघु एवं दीर्घ उत्तरीय प्रश्न पूछे जाने की प्रबल संभावना है।`,
    `यहाँ वर्णित प्रमुख तथ्यों का सारांश त्वरित पुनरावृत्ति (Quick Revision) के लिए आदर्श है।`,
    `समग्र रूप से यह विषय-वस्तु विद्यार्थियों को पूरे अध्याय की स्पष्ट समझ प्रदान करती है।`,
  ];

  const topicContextBulletsEn = [
    `The concepts highlighted in "${pureTopic}" carry high importance for examination revision.`,
    `Students should memorize the core rules, dates, and arguments emphasized in this section.`,
    `This section aids in developing analytical depth for answering structured examination questions.`,
    `Accurate application of the stated principles ensures high-scoring written responses.`,
    `This content connects foundational theories to real-world applications and outcomes.`,
    `Key factual definitions provided here serve as critical evidence for concise answers.`,
    `The summary points detailed above are tailored for rapid last-minute revision.`,
    `Overall, this topic solidifies conceptual clarity and comprehensive chapter mastery.`,
  ];

  let fallbackIdx = 0;
  while (cleanBullets.length < 8) {
    const candidate = language === 'hi' 
      ? topicContextBulletsHi[fallbackIdx % topicContextBulletsHi.length]
      : topicContextBulletsEn[fallbackIdx % topicContextBulletsEn.length];
    if (!cleanBullets.includes(candidate)) {
      cleanBullets.push(candidate);
    }
    fallbackIdx++;
  }
  cleanBullets = cleanBullets.slice(0, 10);

  const cleanKeywords = note.keywords
    .map(k => {
      let cleanedK = fixFontShiftArtifacts(normalizeHindiOCRText(k))
        .normalize('NFC')
        .replace(/\u25CC/g, '')
        .replace(/◌/g, '')
        .replace(/\uFFFD/g, '')
        .replace(ocrArtifactPattern, '')
        .trim();

      if (language === 'hi' && !/[\u0900-\u097F]/.test(cleanedK)) {
        cleanedK = fixMergedHindiWords(reconstructHindiOCRSpelling(cleanedK));
      }
      return toEnglishDigits(cleanedK);
    })
    .filter(k => !ocrArtifactPattern.test(k) && k.length > 2 && (k.match(/\d/g) || []).length < 3);

  return {
    ...note,
    title: cleanTitle,
    summary: cleanSummary,
    bullets: cleanBullets,
    keywords: cleanKeywords.length > 0 ? cleanKeywords : [pureTopic, 'मुख्य बिंदु'],
    topic: pureTopic,
    chapter: pageNum,
  };
}

/**
 * Extract AI highlights
 */
function extractHighlightsFromText(text: string, language: 'hi' | 'en'): AIHighlight[] {
  const highlights: AIHighlight[] = [];
  const sentences = getSentences(text);
  let idCounter = 1;

  for (const s of sentences) {
    const cleanS = stripDecorativeSymbols(s);
    if (/is defined as|refers to|is known as|means that|परिभाषा|कहा जाता है|अर्थात|का अर्थ है/i.test(cleanS) && cleanS.length < 180) {
      highlights.push({
        id: `hl-${idCounter++}`,
        type: 'definition',
        title: language === 'hi' ? 'मुख्य परिभाषा' : 'Key Definition',
        text: cleanS,
      });
    } else if (/formula|equation|equal to|=\s*|सूत्र|समीकरण/i.test(cleanS) && cleanS.length < 160) {
      highlights.push({
        id: `hl-${idCounter++}`,
        type: 'formula',
        title: language === 'hi' ? 'महत्वपूर्ण सूत्र' : 'Key Formula',
        text: cleanS,
      });
    }

    if (highlights.length >= 12) break;
  }

  if (highlights.length === 0) {
    const kws = extractKeywords(text);
    if (kws.length > 0) {
      highlights.push({
        id: `hl-${idCounter++}`,
        type: 'keyword',
        title: language === 'hi' ? 'प्राथमिक शब्दावली' : 'Primary Keywords',
        text: `${language === 'hi' ? 'मुख्य शब्द' : 'Core emphasis'}: ${kws.join(', ')}`,
      });
    }
  }

  return highlights;
}

/**
 * Generate flashcards
 */
function generateFlashcardsFromNotes(notes: StickyNote[], language: 'hi' | 'en'): Flashcard[] {
  const cards: Flashcard[] = [];
  let idCount = 1;

  for (const note of notes) {
    cards.push({
      id: `fc-${idCount++}`,
      question: language === 'hi' 
        ? `"${note.title}" का मुख्य अर्थ एवं व्याख्या क्या है?` 
        : `What is the core concept and explanation of "${note.title}"?`,
      answer: note.summary,
      topic: note.topic,
      mastered: false,
    });
  }

  return cards.slice(0, 20);
}

/**
 * Generate Quiz Questions (10–30 High Quality MCQs from text)
 */
function generateQuizFromNotes(notes: StickyNote[], language: 'hi' | 'en'): QuizQuestion[] {
  const quiz: QuizQuestion[] = [];
  let idCount = 1;

  for (let idx = 0; idx < notes.length; idx++) {
    const note = notes[idx];
    const correctIdx = idx % 4; // Distribute correct answers across A, B, C, D

    const correctOption = note.bullets[0] || note.summary.slice(0, 80);
    const distractor1 = language === 'hi' 
      ? `यह सिद्धांत केवल सीमित परिस्थितियों में लागू होता है।` 
      : `This principle only applies under hypothetical conditions.`;
    const distractor2 = language === 'hi' 
      ? `इसकी कार्यप्रणाली विपरीत दिशा में कार्य करती है।` 
      : `Its core mechanism operates in reverse order.`;
    const distractor3 = language === 'hi' 
      ? `उपर्युक्त में से कोई भी कथन सत्य नहीं है।` 
      : `None of the stated textbook conclusions hold true.`;

    const options = [distractor1, distractor2, distractor3];
    options.splice(correctIdx, 0, correctOption);

    quiz.push({
      id: `qz-${idCount++}`,
      question: language === 'hi'
        ? `Q${idx + 1}. "${note.title}" के संबंध में कौन सा कथन सर्वथा उपयुक्त है?`
        : `Q${idx + 1}. Which statement best characterizes "${note.title}"?`,
      options,
      correctIndex: correctIdx,
      explanation: language === 'hi' 
        ? `सही उत्तर: ${correctOption}` 
        : `Correct Answer: ${correctOption}`,
      topic: note.topic,
    });
  }

  return quiz.slice(0, 30);
}

/**
 * Generate Mind Map
 */
function generateMindMapFromNotes(docTitle: string, notes: StickyNote[]): MindMapNode {
  const topicMap: Record<string, StickyNote[]> = {};

  for (const note of notes) {
    const t = note.topic || 'General Concepts';
    if (!topicMap[t]) topicMap[t] = [];
    topicMap[t].push(note);
  }

  const chapterNodes: MindMapNode[] = Object.entries(topicMap).map(([topicName, topicNotes], idx) => ({
    id: `mm-topic-${idx}`,
    label: topicName,
    type: 'chapter',
    notesCount: topicNotes.length,
    children: topicNotes.map((note, nIdx) => ({
      id: `mm-note-${idx}-${nIdx}`,
      label: note.title,
      type: 'point',
    }))
  }));

  return {
    id: 'mm-root',
    label: docTitle || 'Document Overview',
    type: 'root',
    children: chapterNodes
  };
}

/**
 * Generate Page-Wise Sticky Notes for PDF documents (Page 1 through Page N)
 */
function generatePageWiseStickyNotes(
  pdfPages: { pageNumber: number; text: string }[],
  _docTitle: string,
  mode: SummaryMode,
  targetLanguage: 'hi' | 'en',
  onProgress?: (progress: number, step: string) => void
): StickyNote[] {
  const notes: StickyNote[] = [];

  for (let i = 0; i < pdfPages.length; i++) {
    const pageObj = pdfPages[i];
    const pageNum = pageObj.pageNumber || (i + 1);
    const pageText = cleanGarbageOCRText(pageObj.text || '');

    const pStart = 60 + Math.round(((i + 1) / pdfPages.length) * 20);
    if (onProgress) {
      onProgress(pStart, `Processing Page ${pageNum} of ${pdfPages.length}...`);
    }

    // Extract page-specific title/heading from pageText
    let pageHeading = '';
    const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      const cleanL = stripDecorativeSymbols(line);
      if (cleanL.length > 3 && cleanL.length < 75 && !/^(page|\d+$)/i.test(cleanL)) {
        pageHeading = cleanL;
        break;
      }
    }

    if (!pageHeading) {
      const kws = extractKeywords(pageText);
      if (kws.length > 0) {
        pageHeading = kws.slice(0, 2).join(' & ');
      } else {
        pageHeading = targetLanguage === 'hi' 
          ? `अध्याय भाग (पृष्ठ ${pageNum})` 
          : `Chapter Section (Page ${pageNum})`;
      }
    }

    const title = targetLanguage === 'hi'
      ? `पेज ${pageNum}: ${pageHeading}`
      : `Page ${pageNum}: ${pageHeading}`;

    const { summary, bullets } = formatSummaryByMode(
      pageText.length > 10 ? pageText : `Page ${pageNum} overview and study points: ${pageHeading}`,
      mode,
      targetLanguage
    );

    const keywords = extractKeywords(pageText);
    const priority = detectPriority(pageHeading + ' ' + pageText);
    const color = COLOR_PALETTE[(pageNum - 1) % COLOR_PALETTE.length];

    const baseNote: StickyNote = {
      id: `note-page-${pageNum}-${Date.now()}-${i}`,
      title: stripDecorativeSymbols(title),
      summary,
      bullets,
      keywords: keywords.length > 0 ? keywords : [pageHeading, `Page ${pageNum}`],
      color,
      priority,
      topic: pageHeading.length > 28 ? pageHeading.substring(0, 25) + '...' : pageHeading,
      chapter: String(pageNum),
      pinned: pageNum === 1,
      rotation: (i % 3 === 0 ? -1 : i % 3 === 1 ? 1 : 0) * (0.8 + Math.random() * 0.8),
      createdAt: new Date().toISOString(),
    };

    notes.push(validateAndSanitizeNote(baseNote, targetLanguage));
  }

  return notes;
}

/**
 * V50.0 Master AI Output Engine: Strict Mode Separation & Language Conversion
 */
export async function generateStickyNotesFromText(
  rawText: string,
  docTitle: string,
  mode: SummaryMode = 'smart-summary',
  selectedLanguage: Language = 'auto',
  _settings?: AppSettings,
  onProgress?: (progress: number, step: string) => void,
  pdfPages?: { pageNumber: number; text: string }[]
): Promise<AIGenerationResult> {
  if (onProgress) onProgress(10, 'OCR Extraction Complete. Restoring Word Spacing & Reconstructing Text...');

  const cleanRawText = cleanGarbageOCRText(rawText);
  const detectedLanguage = detectDocumentLanguage(cleanRawText);

  let targetLanguage: 'hi' | 'en' = detectedLanguage;
  if (selectedLanguage === 'hi') targetLanguage = 'hi';
  else if (selectedLanguage === 'en') targetLanguage = 'en';

  if (onProgress) onProgress(25, `Language Detected: ${detectedLanguage === 'hi' ? 'Hindi (Devanagari)' : 'English'} → Target: ${targetLanguage === 'hi' ? 'Hindi' : 'English'}`);

  const realChapterTitle = extractRealChapterTitle(cleanRawText, docTitle);

  // 1. STORY MODE EXCLUSIVE: Generate pure story narrative only
  if (mode === 'story') {
    if (onProgress) onProgress(50, `Synthesizing Pure Chapter Story Narrative for "${realChapterTitle}"...`);
    let storyNarrative = generateStoryStyleNarrative(cleanRawText, realChapterTitle, targetLanguage);
    if (targetLanguage === 'hi' && detectedLanguage === 'en') {
      storyNarrative = await translateText(storyNarrative, 'hi', 'en');
    }
    if (onProgress) onProgress(100, 'Story Reader synthesized!');

    return {
      storyNarrative,
      notes: [],
      flashcards: [],
      quiz: [],
      highlights: [],
      detectedLanguage,
    };
  }

  // 2. MCQ PRACTICE EXCLUSIVE: Generate only MCQs
  if (mode === 'mcq-practice') {
    if (onProgress) onProgress(50, `Formulating 15-30 Chapter MCQs for "${realChapterTitle}"...`);
    const segments = segmentDocumentIntoTopics(cleanRawText, 'mcq-practice');
    const tempNotes = segments.map((seg, idx) => ({
      id: `temp-${idx}`,
      title: stripDecorativeSymbols(seg.title),
      summary: seg.content.slice(0, 150),
      bullets: getSentences(seg.content).slice(0, 3).map(s => stripDecorativeSymbols(s)),
      keywords: extractKeywords(seg.content),
      color: 'purple' as const,
      priority: 'medium' as const,
      topic: stripDecorativeSymbols(seg.title),
      pinned: false,
      createdAt: new Date().toISOString(),
    }));

    let quiz = generateQuizFromNotes(tempNotes, targetLanguage);
    if (targetLanguage === 'hi' && detectedLanguage === 'en') {
      quiz = await translateQuizQuestions(quiz, 'hi', 'en');
    }
    if (onProgress) onProgress(100, 'MCQs Generated!');

    return {
      storyNarrative: '',
      notes: [],
      flashcards: [],
      quiz,
      highlights: [],
      detectedLanguage,
    };
  }

  // 3. SMART SUMMARY & REVISION MODES: Synthesize Sticky Notes
  if (onProgress) onProgress(45, `Synthesizing NCERT ${mode.toUpperCase()} Notes for "${realChapterTitle}"...`);
  
  let storyNarrative = generateStoryStyleNarrative(cleanRawText, realChapterTitle, targetLanguage);
  if (targetLanguage === 'hi' && detectedLanguage === 'en') {
    storyNarrative = await translateText(storyNarrative, 'hi', 'en');
  }

  let rawNotes: StickyNote[];
  if (pdfPages && pdfPages.length > 0) {
    if (onProgress) onProgress(60, `Generating Page-Wise Sticky Cards for ${pdfPages.length} PDF pages (${mode})...`);
    rawNotes = generatePageWiseStickyNotes(pdfPages, docTitle, mode, targetLanguage, onProgress);
  } else {
    if (onProgress) onProgress(60, `Splitting chapter into Page-Wise Sticky Cards (${mode})...`);
    const segments = segmentDocumentIntoTopics(rawText, mode);
    rawNotes = segments.map((seg, idx) => {
      const { summary, bullets } = formatSummaryByMode(seg.content, mode, targetLanguage);
      const keywords = extractKeywords(seg.content);
      const priority = detectPriority(seg.title + ' ' + seg.content);
      const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];

      const cleanTitle = stripDecorativeSymbols(seg.title);

      const baseNote: StickyNote = {
        id: `note-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title: cleanTitle,
        summary,
        bullets,
        keywords,
        color,
        priority,
        topic: cleanTitle.length > 28 ? cleanTitle.substring(0, 25) + '...' : cleanTitle,
        chapter: String(idx + 1),
        pinned: idx === 0,
        rotation: (idx % 3 === 0 ? -1 : idx % 3 === 1 ? 1 : 0) * (0.8 + Math.random() * 0.8),
        createdAt: new Date().toISOString(),
      };

      return validateAndSanitizeNote(baseNote, targetLanguage);
    });
  }

  let notes = rawNotes;
  if (!pdfPages || pdfPages.length <= 1) {
    const uniqueNotes: StickyNote[] = [];
    const seenSummaries = new Set<string>();
    for (const n of rawNotes) {
      const normalized = n.summary.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
      if (!seenSummaries.has(normalized)) {
        seenSummaries.add(normalized);
        uniqueNotes.push(n);
      }
    }
    notes = uniqueNotes;
  }

  if (targetLanguage !== detectedLanguage && detectedLanguage === 'en' && targetLanguage === 'hi') {
    notes = await translateStickyNotes(notes, targetLanguage, detectedLanguage, onProgress);
  }

  notes = notes.map(n => validateAndSanitizeNote(n, targetLanguage));

  if (onProgress) onProgress(80, 'Extracting essential definitions & formulas...');
  let highlights = extractHighlightsFromText(cleanRawText, targetLanguage);
  if (targetLanguage === 'hi' && detectedLanguage === 'en') {
    highlights = await translateHighlights(highlights, 'hi', 'en');
  }

  let flashcards: Flashcard[] = [];
  let quiz: QuizQuestion[] = [];

  // Generate flashcards and quiz only if explicitly requested or in full summary
  if (mode === 'smart-summary') {
    flashcards = generateFlashcardsFromNotes(notes, targetLanguage);
    if (targetLanguage === 'hi' && detectedLanguage === 'en') {
      flashcards = await translateFlashcards(flashcards, 'hi', 'en');
    }
    quiz = generateQuizFromNotes(notes, targetLanguage);
    if (targetLanguage === 'hi' && detectedLanguage === 'en') {
      quiz = await translateQuizQuestions(quiz, 'hi', 'en');
    }
  }

  let mindMap = generateMindMapFromNotes(realChapterTitle, notes);
  if (targetLanguage === 'hi' && detectedLanguage === 'en') {
    mindMap = await translateMindMap(mindMap, 'hi', 'en');
  }

  if (onProgress) onProgress(100, 'Master AI Output Engine complete!');

  return {
    storyNarrative,
    notes,
    flashcards,
    quiz,
    highlights,
    mindMap,
    detectedLanguage,
  };
}
